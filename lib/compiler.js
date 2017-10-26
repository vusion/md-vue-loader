const markdown = require("markdown-it");
const path = require("path");
const fs = require("fs");
const loaderUtils = require("loader-utils");
const hljs = require("highlight.js");
const cheerio = require("cheerio");
const Token = require("markdown-it/lib/token");
const Util = require("./util.js");

let parser = null;
let cacheDir = '';
let wrapper = '';
let preprocess = null;
let componentsQueue = null;

const addVuePreviewAttr = function (str) {
    return str.replace(/(<pre|<code)/g, "$1 v-pre");
};

const defaultMarkdownOps = {
    preset: "default",
    html: true,
    highlight: function (str, rawLang) {
        let lang = rawLang;
        if (rawLang === 'vue') {
            lang = 'html';
        }
        if (lang && hljs.getLanguage(lang)) {
            try {
                const result = hljs.highlight(lang, str).value;
                return `<pre class="hljs ${this.langPrefix}${rawLang}"><code>${result}</code></pre>`;
            } catch (e) {}
        }
        const result = parser.utils.escapeHtml(str);
        return `<pre class="hljs"><code>${result}</code></pre>`;
    },
    wrapper: 'section'
};

const getParse = function getParse() {
    const params = this.query ? (typeof this.query === 'object' ? this.query : loaderUtils.parseQuery(this.query)) : {};
    const vueMarkdownOptions = (this.options || {}).__vueMarkdownOptions__ || {};
    let opts = Object.create(vueMarkdownOptions.__proto__);

    opts = Object.assign(opts, params, vueMarkdownOptions);
    if (typeof opts.render === "function") {
        parser = opts;
    } else {
        opts = Object.assign(defaultMarkdownOps, opts);
        parser = markdown(opts.preset, opts);
        const plugins = opts.use;

        if (plugins) {
            plugins.forEach(function (plugin) {
                if (Array.isArray(plugin)) {
                    parser.use.apply(parser, plugin);
                } else {
                    parser.use(plugin);
                }
            });
        }
    }
    cacheDir = opts.cacheDir;
    wrapper = opts.wrapper;
    preprocess = opts.preprocess;
    return parser;
};

/**
 * override default parser rules by adding v-pre attribute on 'code' and 'pre' tags
 * @param {Array<string>} rules rules to override
 */
const overrideParserRules = function overrideParserRules(parser, rules) {
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

/**
 * html => vue file template
 * @param  {[type]} html [description]
 * @return {[type]}      [description]
 */
const renderVueTemplate = function (html, wrapper) {
    const $ = cheerio.load(html, {
        decodeEntities: false,
        lowerCaseAttributeNames: false,
        lowerCaseTags: false
    });
    const format = function format(components) {
        let importsLabel = '';
        let i = 0;
        let componentsLabel = '{';
        for (let key in components) {
            i++;
            importsLabel += `import C${i} from '${components[key]}';\n`;
            componentsLabel += `\n'${key}': C${i},`;
        }
        componentsLabel += '\n},';
        return {
            imports: importsLabel,
            components: componentsLabel,
        };
    }
    const output = {
        style: $.html("style"),
        script: !Object.keys(componentsQueue).length ? '' : `
        <script>
            ${format(componentsQueue).imports}
            export default {
                components: ${format(componentsQueue).components}
            }
        </script>
        `,
    };
    $("style").remove();
    $("script").remove();
    return `<template><${wrapper}>${$.html()}</${wrapper}></template>\n${output.style}\n${output.script}`;
};

const loaderVUEComponents = function (source, cacheDir) {
    const reg = /```(.+?)\r?\n([\s\S]+?)\r?\n```/g;
    source = source.replace(reg, (m, lang, content) => {
        lang = lang.trim();
        // Remove whitespace between tags
        content = content.trim().replace(/>\s+</g, '><');
        if (lang === 'vue') {
            let autoComponentName = 'auto-' + Util.md5(content);
            const lockAutoComponentName = autoComponentName;
            while (componentsQueue[autoComponentName]) {
                autoComponentName = Util.md5(autoComponentName);
            }
            const fileName = path.join(cacheDir, lockAutoComponentName + '.vue');
            if (!fs.existsSync(fileName)) {
                fs.writeFileSync(fileName, content);
            }
            componentsQueue[autoComponentName] = `${fileName.replace(/\\/g, '/')}`;
            return `<div class="u-example"><${autoComponentName} /></div>\n\n` + m;
        } else if (lang === 'html') {
            return `<div class="u-example">${content}</div>\n\n` + m;
        } else {
            return m;
        }
    });
    return source;
};

module.exports = function loader(content) {
    let result = content;
    parser = getParse.apply(this);
    componentsQueue = {};
    overrideParserRules(parser, ["code_inline", "code_block", "fence"]);
    if (preprocess) {
        content = preprocess.call(this, parser, content);
    }
    content = content.replace(/@/g, "__at__");
    content = loaderVUEComponents(content, cacheDir);
    content = parser.render(content).replace(/__at__/g, "@");
    result = renderVueTemplate(content, wrapper);
    return result;
};