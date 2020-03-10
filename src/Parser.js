const path = require('path');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const loaderUtils = require('loader-utils');
const hashSum = require('hash-sum');
const VirtualModuleWebpack = require('virtual-module-webpack-plugin');
VirtualModuleWebpack.statsDate = function (inputDate) {
    if (!inputDate) {
        inputDate = new Date();
    }
    return inputDate;
};

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
                    return saved.apply(this, args).replace(/(<pre|<code)(?![^\s])/g, '$1 v-pre');
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
            codeProcess(live, code, content, lang, modifier) {
                if (live) {
                    return `\n<div${modifier ? ' style="' + modifier + '"' : ''}>${live}</div>\n${code}\n`;
                } else
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
            highlight: (content, lang, modifier) => {
                content = content.trim();
                lang = lang.trim();

                let hlLang = lang;
                if (lang === 'vue' || lang === 'htm')
                    hlLang = 'html';

                /* eslint-disable no-use-before-define */
                let code = '';
                if (hlLang && hljs.getLanguage(hlLang)) {
                    try {
                        const result = hljs.highlight(hlLang, content).value;
                        code = `<pre class="hljs ${markdown.options.langPrefix}${lang}"><code>${result}</code></pre>\n`;
                    } catch (e) {}
                } else {
                    const result = markdown.utils.escapeHtml(content);
                    code = `<pre class="hljs"><code>${result}</code></pre>\n`;
                }

                const live = this.options.live ? this.liveComponent(lang, content) : '';
                return this.options.codeProcess.call(this, live, code, content, lang, modifier);
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
            const cap = info.match(/\s+/);

            let langName = '';
            let modifier = '';
            if (!cap)
                langName = info;
            else {
                langName = info.slice(0, cap.index);
                modifier = info.slice(cap.index + cap[0].length).replace(/^\{|\}$/g, '');
            }
            return options.highlight(token.content, langName, modifier);
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
        // 本文件中的 components
        this.components = [];
    }

    createFile(filePath, contents) {
        const fs = this.loader.fs || this.loader._compilation.inputFileSystem;
        VirtualModuleWebpack.populateFilesystem({
            fs,
            modulePath: filePath,
            contents,
        });
    }

    fileExists(filePath) {
        const fs = this.loader.fs || this.loader._compilation.inputFileSystem;
        return fs._readFileStorage.data.has ? fs._readFileStorage.data.has(filePath) : fs._readFileStorage.data[filePath];
    }

    liveComponent(lang, content) {
        const filePath = this.loader.resourcePath;
        const dirname = path.dirname(filePath);

        let live = '';
        if (lang === 'vue') {
            content += '\n';

            // hash 只根据内容判断，如果内容相同，则用同一个文件即可。
            const hash = hashSum(content);
            // AnonymousCodeExample

            const uniqueName = `anondemo-${hash}`;
            const fullPath = path.join(dirname, uniqueName + '.vue');
            if (!this.fileExists(fullPath)) {
                this.createFile(fullPath, content);
                this.loader.addDependency(fullPath);
            }

            this.components.push({ uniqueName, fullPath });

            // inject tag
            live = `<${uniqueName} />`;
        } else if (lang === 'html')
            live = content;

        return live;
    }

    renderVue(html) {
        html = `<template><${this.options.wrapper}>${html}</${this.options.wrapper}></template>\n`;

        let script = '';

        if (this.components.length) {
            let importsString = '';

            let componentsString = '{\n';
            this.components.forEach((component, index) => {
                importsString += `import Component${index} from ${loaderUtils.stringifyRequest(this.loader, component.fullPath)};\n`;
                componentsString += `'${component.uniqueName}': Component${index},\n`;
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
