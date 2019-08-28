const path = require('path');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const loaderUtils = require('loader-utils');
const hashSum = require('hash-sum');
const VirtualStats = require('./Status');

const componentsCache = {};

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
            codeProcess(live, code, content, lang) {
                if (live) {
                    return `\n<div>${live}</div>\n${code}\n`;
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
            highlight: (content, lang) => {
                content = content.trim();
                lang = lang.trim();

                let hlLang = lang;
                if (lang === 'vue' || lang === 'htm')
                    hlLang = 'html';

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
                return this.options.codeProcess.call(this, live, code, content, lang);
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
        // 本文件中的 components
        this.components = [];
    }

    createFile(filename, content) {
        const fs = this.loader.fs || this.loader._compilation.inputFileSystem;
        Parser.populateFilesystem({ fs,
            modulePath: filename,
            contents: content });
        this.loader.addDependency(filename);
    }

    liveComponent(lang, content) {
        const filePath = this.loader.resourcePath;
        const dirname = path.dirname(filePath);
        // const basename = path.basename(filePath);

        let live = '';
        if (lang === 'vue') {
            content += '\n';

            // hash 只根据内容判断，如果内容相同，则用同一个文件即可。
            const hash = hashSum(content);
            // AnonymousCodeExample
            const uniqueName = `anondemo-${hash}-${content.length}`;
            // const index = Object.keys(this.components).length;
            // const uniqueName = `c-${hashSum(filePath + '-' + content)}-${index}`;
            // const prefix = basename.replace(/\./g, '-') + '-';
            if (!componentsCache[uniqueName]) {
                const filename = path.join(dirname, uniqueName + '.vue').replace(/\\/g, '/');
                componentsCache[uniqueName] = filename;
                this.createFile(filename, content);
            }
            this.components.push(uniqueName);

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
            this.components.forEach((uniqueName, index) => {
                importsString += `import Component${index} from ${loaderUtils.stringifyRequest(this.loader, componentsCache[uniqueName])};\n`;
                componentsString += `'${uniqueName}': Component${index},\n`;
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

    static populateFilesystem(options) {
        const fs = options.fs;
        const modulePath = options.modulePath;
        const contents = options.contents;
        const mapIsAvailable = typeof Map !== 'undefined';
        const statStorageIsMap = mapIsAvailable && fs._statStorage.data instanceof Map;
        const readFileStorageIsMap = mapIsAvailable && fs._readFileStorage.data instanceof Map;

        if (readFileStorageIsMap) { // enhanced-resolve@3.4.0 or greater
            if (fs._readFileStorage.data.has(modulePath)) {
                return;
            }
        } else if (fs._readFileStorage.data[modulePath]) { // enhanced-resolve@3.3.0 or lower
            return;
        }
        const stats = Parser.createStats(options);
        if (statStorageIsMap) { // enhanced-resolve@3.4.0 or greater
            fs._statStorage.data.set(modulePath, [null, stats]);
        } else { // enhanced-resolve@3.3.0 or lower
            fs._statStorage.data[modulePath] = [null, stats];
        }
        if (readFileStorageIsMap) { // enhanced-resolve@3.4.0 or greater
            fs._readFileStorage.data.set(modulePath, [null, contents]);
        } else { // enhanced-resolve@3.3.0 or lower
            fs._readFileStorage.data[modulePath] = [null, contents];
        }
    }

    static statsDate(inputDate) {
        if (!inputDate) {
            inputDate = new Date();
        }
        return inputDate;
    }

    static createStats(options) {
        if (!options) {
            options = {};
        }
        if (!options.ctime) {
            options.ctime = Parser.statsDate();
        }
        if (!options.mtime) {
            options.mtime = Parser.statsDate();
        }
        if (!options.size) {
            options.size = 0;
        }
        if (!options.size && options.contents) {
            options.size = options.contents.length;
        }
        return new VirtualStats({
            dev: 8675309,
            nlink: 1,
            uid: 501,
            gid: 20,
            rdev: 0,
            blksize: 4096,
            ino: 44700000,
            mode: 33188,
            size: options.size,
            atime: options.mtime,
            mtime: options.mtime,
            ctime: options.ctime,
            birthtime: options.ctime,
        });
    }
}

module.exports = Parser;
