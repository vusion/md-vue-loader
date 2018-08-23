const path = require('path');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const vfs = require('./virtual');
const loaderUtils = require('loader-utils');
const hashSum = require('hash-sum');

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
            codeProcess(live, code) {
                if (live)
                    return `<u-code-example><div>${live}</div><div slot="code">${code}</div></u-code-example>\n\n`;
                else
                    return code;
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
            highlight: (content, rawLang) => {
                content = content.trim();
                rawLang = rawLang.trim();

                let lang = rawLang;
                if (rawLang === 'vue')
                    lang = 'html';

                let code = '';
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        const result = hljs.highlight(lang, content).value;
                        code = `<pre class="hljs ${markdown.options.langPrefix}${rawLang}"><code>${result}</code></pre>\n`;
                    } catch (e) {}
                } else {
                    const result = markdown.utils.escapeHtml(content);
                    code = `<pre class="hljs"><code>${result}</code></pre>\n`;
                }

                const live = this.options.live ? this.liveComponent(rawLang, content) : '';
                return this.options.codeProcess(live, code);
            },
        };

        // merge user options into defaults
        this.options = Object.assign({}, defaultOptions, options);
        this.options.markdown = Object.assign({}, defaultMarkdownOptions, options.markdown);
        // init MarkdownIt instance
        const markdown = this.markdown = new MarkdownIt(this.options.markdown);
        markdown.renderer.rules.fence = function (tokens, idx, options) {
            const token = tokens[idx];
            const info = token.info ? markdown.utils.unescapeAll(token.info).trim() : '';
            const langName = info.split(/\s+/g)[0];
            return options.highlight(token.content, langName);
        };

        // v-pre must be set
        ensureVPre(markdown);
        // apply rules
        if (this.options.rules) {
            const rendererRules = markdown.renderer.rules;
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
                    markdown.use(...plugin);
                else if (plugin)
                    markdown.use(plugin);
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

    liveComponent(lang, content) {
        const filepath = this.loader.resourcePath;
        const dirname = path.dirname(filepath);
        const basename = path.basename(filepath);
        // console.log(filepath);

        let live = '';
        if (lang === 'vue') {
            content += '\n';

            const index = Object.keys(this.components).length;
            const uniqueName = `c-${hashSum(filepath + '-' + content)}-${index}`;
            const prefix = basename.replace(/\./g, '-') + '-';
            const filename = path.join(dirname, prefix + uniqueName + '.vue').replace(/\\/g, '/');
            this.components[uniqueName] = filename;

            console.log(filename);
            this.createFile(filename, content);
            // inject tag
            live = `<${uniqueName} />`;
        } else if (lang === 'html')
            live = content;

        return live;
    }

    renderVue(html) {
        html = `<template><${this.options.wrapper}>${html}</${this.options.wrapper}></template>\n`;

        let script = '';

        if (Object.keys(this.components).length) {
            let importsString = '';

            let componentsString = '{\n';
            Object.keys(this.components).forEach((key, index) => {
                importsString += `import Component${index} from ${loaderUtils.stringifyRequest(this.loader, this.components[key])};\n`;
                componentsString += `'${key}': Component${index},\n`;
            });
            componentsString += '},';

            script = `
<script>
    ${importsString}
    export default {
        components: ${componentsString}
    }
</script>
            `;
        }

        return html + script;
    }

    parse(source) {
        this.reset();
        if (this.options.preprocess)
            source = this.options.preprocess.call(this, source);

        const html = this.markdown.render(source);
        let result = this.renderVue(html);

        if (this.options.postprocess)
            result = this.options.postprocess.call(this, result);
        return result;
    }
}

module.exports = Parser;
