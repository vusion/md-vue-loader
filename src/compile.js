const markdown = require('markdown-it');
const path = require('path');
const fs = require('fs');
const loaderUtils = require('loader-utils');
const hljs = require('highlight.js');
const cheerio = require('cheerio');
const Token = require('markdown-it/lib/token');
const hash = require('hash-sum');
const Virtual = require('./virtual');

let parser = null;
let loader = null;
let wrapper = 'section';
let preprocess = null;
let componentsQueue = null;

const defaultMarkdownOps = {
    preset: 'default',
    html: true,
    highlight: function (str, rawLang) {
        let lang = rawLang;
        if (rawLang === 'vue') {
            lang = 'html';
        }
        if (lang && hljs.getLanguage(lang)) {
            try {
                const result = hljs.highlight(lang, str).value;
                return `<pre class='hljs ${this.langPrefix}${rawLang}'><code>${result}</code></pre>`;
            } catch (e) {}
        }
        const result = parser.utils.escapeHtml(str);
        return `<pre class='hljs'><code>${result}</code></pre>`;
    },
};

const getParse = function getParse() {
    const params = this.query ? (typeof this.query === 'object' ? this.query : loaderUtils.parseQuery(this.query)) : {};
    const vueMarkdownHTMLOptions = (this.options || {}).__vueMarkdownHTMLOptions__ || {};
    let opts = Object.create(vueMarkdownHTMLOptions.__proto__);

    opts = Object.assign(opts, params, vueMarkdownHTMLOptions);
    let markdownOps = opts.markdownIt;
    // self define parser
    if (typeof markdownOps.render === 'function') {
        parser = markdownOps;
    } else {
        markdownOps = Object.assign(defaultMarkdownOps, markdownOps);
        parser = markdown(markdownOps.preset, markdownOps);
        const markdownPlugins = opts.markdownItPlugins;
        if (markdownPlugins) {
            markdownPlugins.forEach(function (plugin) {
                if (Array.isArray(plugin)) {
                    parser.use.apply(parser, plugin);
                } else {
                    parser.use(plugin);
                }
            });
        }
    }
    wrapper = opts.wrapper || wrapper;
    preprocess = opts.preprocess;
    return parser;
};

/**
 * override default parser rules by adding v-pre attribute on 'code' and 'pre' tags
 * @param {Array<string>} rules rules to override
 */
const overrideParserRules = function overrideParserRules(parser, rules) {
    const addVuePreviewAttr = function (str) {
        return str.replace(/(<pre|<code)/g, '$1 v-pre');
    };
    if (parser && parser.renderer && parser.renderer.rules) {
        var parserRules = parser.renderer.rules;
        rules.forEach(function (rule) {
            if (parserRules && parserRules[rule]) {
                var defaultRule = parserRules[rule];
                parserRules[rule] = function () {
                    return addVuePreviewAttr(defaultRule.apply(this, arguments));
                };
            }
        });
    }
}

const renderVueTemplate = function (html) {
    const $ = cheerio.load(html, {
        decodeEntities: false,
        lowerCaseAttributeNames: false,
        lowerCaseTags: false
    });
    const getScript = function getScript(componentsQueue) {
        let importsLabel = '';
        let componentsLabel = '{';
        Object.keys(componentsQueue).forEach((key, index) => {
            importsLabel += `import Component${index} from ${loaderUtils.stringifyRequest(loader, componentsQueue[key])};\n`;
            componentsLabel += `\n'${key}': Component${index},`;
        });
        componentsLabel += '\n},';
        return `
            <script>
                ${importsLabel}
                export default {
                    components: ${componentsLabel}
                }
            </script>
        `;
    };
    const output = {
        style: $.html('style'),
        script: !Object.keys(componentsQueue).length ? '' : getScript(componentsQueue),
    };
    $('style').remove();
    $('script').remove();
    return `<template><${wrapper}>${$.html()}</${wrapper}></template>\n${output.style}\n${output.script}`;
};

const getUniqueName = function name(content, checkSame) {
    let autoGenerateComponentName = hash(content);
    while(checkSame(autoGenerateComponentName)) {
        autoGenerateComponentName = hash(autoGenerateComponentName);
    }
    return autoGenerateComponentName;
};

const generateVirtualFile = function generateCacheVUEFile(fileName, content) {
    Virtual.addFile(loader.fs, fileName, content);
};

const loaderVueComponents = function (source, dirname, basename) {
    const reg = /```(.+?)\r?\n([\s\S]+?)\r?\n```/g;
    const loader = this;
    source = source.replace(reg, function (m, lang, content) {
        lang = lang.trim();
        let example = '';
        if (lang === 'vue') {
            const index = Object.keys(componentsQueue).length;
            const prefix = `./${basename.replace(/\./g ,'_')}-${index}-`;
            let autoGenerateComponentName = getUniqueName(dirname + basename + content, function (name) {
                return componentsQueue[prefix + name];
            });
            const fileName = path.join(dirname, prefix + autoGenerateComponentName + '.vue').replace(/\\/g, '/');
            componentsQueue['C'+ autoGenerateComponentName] = fileName;
            generateVirtualFile(fileName, content);
            // inject tag
            example = `<${'C'+ autoGenerateComponentName} />`;
        } else if (lang === 'html') {
            example = content;
        }
        if (example) {
            example = `<div class='u-example'>${example}</div>\n\n`;
        }
        return example + m;
    });
    return source;
};

module.exports = function compiler(content) {
    let result = content;
    loader = this;
    parser = getParse.apply(this);
    componentsQueue = {};
    overrideParserRules(parser, ['code_inline', 'code_block', 'fence']);
    if (preprocess) {
        content = preprocess.call(this, parser, content);
    }
    content = loaderVueComponents.call(this, content, path.dirname(this.resourcePath), path.basename(this.resourcePath));
    content = content.replace(/@/g, '__at__');
    content = parser.render(content).replace(/__at__/g, '@');
    result = renderVueTemplate(content, wrapper);
    return result;
};
