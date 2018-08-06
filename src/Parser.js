const path = require('path');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const hashSum = require('hash-sum');
const vfs = require('./virtual');
const cheerio = require('cheerio');
const loaderUtils = require('loader-utils');

// https://github.com/QingWei-Li/vue-markdown-loader/blob/master/lib/markdown-compiler.js
// Apply `v-pre` to `<pre>` and `<code>` tags
const ensureVPre = function (markdown) {
    if (markdown && markdown.renderer && markdown.renderer.rules) {
        const rules = ['code_inline', 'code_block', 'fence'];
        const rendererRules = markdown.renderer.rules;
        rules.forEach((rule) => {
            if (rendererRules.hasOwnProperty(rule) && typeof rendererRules[rule] === 'function') {
                const saved = rendererRules[rule];
                rendererRules[rule] = function (...args) {
                    return saved.apply(this, args).replace(/(<pre|<code)/g, '$1 v-pre');
                };
            }
        });
    }
};

class Parser {
    constructor(options, loader) {
        options = options || {};
        this.loader = loader;

        // default options
        const defaultOptions = {
            live: true,
            liveProcess(live, code) {
                return live + '\n\n' + code;
            },
            wrapper: 'section',
            markdown: {},
            rules: {},
            plugins: [],
            preprocess: null,
            postprocess: null,
        };

        const defaultMarkdownOptions = {
            html: true,
            langPrefix: 'lang-',
            highlight: (str, rawLang) => {
                let lang = rawLang;
                if (rawLang === 'vue') {
                    lang = 'html';
                }
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        const result = hljs.highlight(lang, str).value;
                        return `<pre class='hljs ${this.markdown.options.langPrefix}${rawLang}'><code>${result}</code></pre>`;
                    } catch (e) {}
                }

                const result = this.markdown.utils.escapeHtml(str);
                return `<pre class='hljs'><code>${result}</code></pre>`;
            },
        };

        // merge user options into defaults
        this.options = Object.assign({}, defaultOptions, options);
        this.options.markdown = Object.assign({}, defaultMarkdownOptions, options.markdown);
        // init MarkdownIt instance
        this.markdown = new MarkdownIt(this.options.markdown);
        // v-pre must be set
        ensureVPre(this.markdown);
        // apply rules
        if (this.options.rules) {
            const rendererRules = this.markdown.renderer.rules;
            const userRules = this.options.rules;
            for (const key in userRules) {
                if (userRules.hasOwnProperty(key) && typeof userRules[key] === 'function') {
                    rendererRules[key] = userRules[key];
                }
            }
        }
        // install plugins
        if (this.options.plugins && this.options.plugins.length) {
            this.options.plugins.forEach((plugin) => {
                if (Array.isArray(plugin))
                    this.markdown.use(...plugin);
                else if (plugin)
                    this.markdown.use(plugin);
            });
        }

        this.reset();
    }

    reset() {
        // this.source = '';
        this.components = {};
    }

    createFile(filename, content) {
        vfs.createFile(this.loader.fs, filename, content);
    }

    fetchComponents(source, filepath) {
        const dirname = path.dirname(filepath);
        const basename = path.basename(filepath);

        const reg = /```(.+?)\r?\n([\s\S]+?)\r?\n```/g;
        source = source.replace(reg, (m, lang, content) => {
            lang = lang.trim();
            content = content.trim();

            let live = '';
            if (lang === 'vue') {
                content = content + '\n';
                const index = Object.keys(this.components).length;
                const uniqueName = 'c-' + hashSum(filepath + '-' + content);
                const prefix = `./${basename.replace(/\./g, '_')}-${index}-`;
                const filename = path.join(dirname, prefix + uniqueName + '.vue').replace(/\\/g, '/');
                this.components[uniqueName] = filename;
                this.createFile(filename, content);
                // inject tag
                live = `<${uniqueName} />`;
            } else if (lang === 'html')
                live = content;

            if (live)
                return this.options.liveProcess(live, m);
            else
                return m;
        });

        return source;
    }

    renderVue(html) {
        const $ = cheerio.load(html, {
            decodeEntities: false,
            lowerCaseAttributeNames: false,
            lowerCaseTags: false,
        });

        const renderScript = () => {
            let importsString = '';
            let componentsString = '{\n';
            Object.keys(this.components).forEach((key, index) => {
                importsString += `import Component${index} from ${loaderUtils.stringifyRequest(this.loader, this.components[key])};\n`;
                componentsString += `'${key}': Component${index},\n`;
            });
            componentsString += '},';
            return `
                <script>
                    ${importsString}
                    export default {
                        components: ${componentsString}
                    }
                </script>
            `;
        };

        const output = {
            style: $.html('style'),
            script: !Object.keys(this.components).length ? '' : renderScript(this.components),
        };
        $('style').remove();
        $('script').remove();

        return `
<template><${this.options.wrapper}>${$.html()}</${this.options.wrapper}></template>
${output.style}
${output.script}
`;
    }

    parse(source) {
        const filepath = this.loader.resourcePath;
        this.reset();
        if (this.options.preprocess)
            source = this.options.preprocess.call(this, source);
        if (this.options.live)
            source = this.fetchComponents(source, filepath);

        const html = this.markdown.render(source);
        let result = this.renderVue(html);
        if (this.options.postprocess)
            result = this.options.postprocess.call(this, result);

        return result;
    }
}

module.exports = Parser;
