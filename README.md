# @vusion/md-vue-loader

[![NPM Version][npm-img]][npm-url]
[![Dependencies][david-img]][david-url]
[![NPM Download][download-img]][download-url]

[npm-img]: http://img.shields.io/npm/v/@vusion/md-vue-loader.svg?style=flat-square
[npm-url]: http://npmjs.org/package/@vusion/md-vue-loader
[david-img]: http://img.shields.io/david/vusion/md-vue-loader.svg?style=flat-square
[david-url]: https://david-dm.org/vusion/md-vue-loader
[download-img]: https://img.shields.io/npm/dm/@vusion/md-vue-loader.svg?style=flat-square
[download-url]: https://npmjs.org/package/@vusion/md-vue-loader

Webpack loader for converting Markdown files to alive Vue components.

## Features

- Live vue/html code blocks
- Use virtual file system to create vue component files
- Cache same vue component
- Hot reload
- Built-in **syntax highlighter** with [highlightjs](https://highlightjs.org)
- Configurable [markdown-it](https://github.com/markdown-it/markdown-it) parser

## Example

Support two kinds of code blocks to live:

1. html code

``` html
<u-button>Button</u-button>
<u-input></u-input>
```

2. vue code

``` vue
<template>
<div :class="$style.root">
    <u-button>Button</u-button>
    <u-input v-model="value"></u-input>
</div>
</template>
<script>
export default {
    data() {
        return {
            value: 'Hello world!',
        };
    },
};
</script>
<style module>
.root {
    width: 200px;
    background: #eee;
}
</style>
```

## Install

``` bash
npm i -D @vusion/md-vue-loader
```

## Usage
### Basic

Simply use `@vusion/md-vue-loader` to load `.md` files and chain it with your `vue-loader`.

``` js
module.exports = {
    module: {
        rules: [{
            test: /\.md$/,
            loader: 'vue-loader!@vusion/md-vue-loader',
        }],
    },
};
```

Note that to get code highlighting to work, you need to:

- Include one of the highlight.js css files into your project. For example: (https://highlightjs.org/static/demo/styles/atom-one-dark.css).
- Specify a lang in code block. Ref: [creating and highlighting code blocks)](https://help.github.com/articles/creating-and-highlighting-code-blocks/).

### With options

``` js
module.exports = {
    module: {
        rules: [{
            test: /\.md$/,
            use: [
                'vue-loader',
                {
                    loader: '@vusion/md-vue-loader',
                    options: {
                        // your preferred options
                    },
                },
            ],
        }],
    },
};
```

### Resource Query

Remember that you can override options in markdown files query.

``` js
const routes = [
    { path: 'article', component: import('./article.md?live=false') },
]
```

### Vue CLI 3

Just chain `@vusion/md-vue-loader` with `vue-loader` in your `vue.config.js` file:

``` js
module.exports = {
    chainWebpack(config) {
        config.module.rule('md')
            .test(/\.md$/)
            .use('vue-loader')
            .loader('vue-loader')
            .end()
            .use('@vusion/md-vue-loader')
            .loader('@vusion/md-vue-loader')
            .end();
    },
};
```

## Options

### live

Enable/Disable live detecting and assembling vue/html code blocks.

- Type: `boolean`
- Default: `true`

### codeProcess

Process after fetching live components from code blocks

- Type: `Function`
- Default: `null`
- @param {string} live - code of live components
- @param {string} code - highlighted code of raw content
- @param {string} content - raw content
- @param {string} lang - code block lang


For example:

``` javascript
codeProcess(live, code, content, lang) {
    // do anything
    return `<div>${live}</div>` + '\n\n' + code;
}
```

For another example, suppose you have a complex container component called `<code-example>`, with some useful slots.

``` javascript
codeProcess(live, code, content, lang) {
    // do anything
    return `<code-example lang="${lang}">
    <div>${live}</div>
    <div slot="code">${code}</div>
</code-example>\n\n`;
}
```

### wrapper

The wrapper of entire markdown content, can be HTML tag name or Vue component name.

- Type: `string`
- Default: `'section'`

### markdown

[markdown-it](https://github.com/markdown-it/markdown-it) options.

- Type: `Object`
- Default:
``` js
{
    html: true,
    langPrefix: 'lang-',
    highlight: (content, lang) => {
        content = content.trim();
        lang = lang.trim();

        let hlLang = lang;
        if (lang === 'vue')
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
```

### plugins

[markdown-it](https://github.com/markdown-it/markdown-it) plugins list.

- Type: `Array`
- Default: `[]`

For example:

``` javascript
plugins: [
    require('markdown-it-task-lists'),
],
```

### rules

[markdown-it](https://github.com/markdown-it/markdown-it) renderer rules.

- Type: `Object`
- Default: `{}`

For example:

``` javascript
rules: {
  'table_open': () => '<div class="table-responsive"><table class="table">',
  'table_close': () => '</table></div>'
}
```

### preprocess

Process before converting.

- Type: `Function`
- Default: `null`
- @param {string} source - Markdown source content

For example:

``` javascript
preprocess(source) {
  // do anything
  return source
}
```

### postprocess

Process after converting.

- Type: `Function`
- Default: `null`
- @param {string} result - Final converted result

For example:

``` javascript
postprocess(result) {
  // do anything
  return result
}
```

- Type: `Function`
- Default: `null`

## Developing

### test

``` shell
npm run test
open test/index.html
```

### test:options

``` shell
npm run test:options
open test/index.html
```

### test:plugins

``` shell
npm run test:plugins
open test/index.html
```

### test:dev

``` shell
npm run test:dev
```

## Changelog

See [Releases](https://github.com/vusion/md-vue-loader/releases)

## Contributing

See [Contributing Guide](https://github.com/vusion/DOCUMENTATION/issues/8)

## Reference

- [vue-markdown-loader](https://github.com/QingWei-Li/vue-markdown-loader)
- [vue-md-loader](https://github.com/wxsms/vue-md-loader)
- [virtual-file-loader](https://github.com/renanhangai/virtual-file-loader)
- [https://github.com/webpack/webpack/issues/5824](https://github.com/webpack/webpack/issues/5824)

## License

[MIT](LICENSE)
