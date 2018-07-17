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

- Configurable [markdown-it](https://github.com/markdown-it/markdown-it) parser
- Built-in **syntax highlighter** with [highlightjs](https://highlightjs.org)
- Live vue/html code blocks
- Hot reload

## Example

Support two kinds of code blocks to live:

``` html
<u-button>Button</u-button>
<u-input></u-input>
```

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

- include one of the highlight.js css files into your project, for example: `highlight.js/styles/github-gist.css`.
- specify a lang in code block. ref: (creating and highlighting code blocks)[https://help.github.com/articles/creating-and-highlighting-code-blocks/].

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

## Options

### live

- Type: `boolean`
- Default: `true`

Enable/Disable live detecting and assembling vue/html code blocks.

### liveProcess

Process after fetching live components from code blocks

- Type: `Function`
- Default: `null`

For example:

``` javascript
liveProcess(live, code) {
  // do anything
  return `<div>${live}</div>` + '\n\n' + code;
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
    preset: 'default',
    html: true,
    highlight(str, rawLang) {
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
        const result = markdown.utils.escapeHtml(str);
        return `<pre class='hljs'><code>${result}</code></pre>`;
    },
};
```

### plugins

[markdown-it](https://github.com/markdown-it/markdown-it) plugins list.

- Type: `Array`
- Default: `[]`

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

For example:

``` javascript
postprocess(result) {
  // do anything
  return result
}
```

- Type: `Function`
- Default: `null`

## Reference

- [vue-markdown-loader](https://github.com/QingWei-Li/vue-markdown-loader)
- [vue-md-loader](https://github.com/wxsms/vue-md-loader)
- [virtual-file-loader](https://github.com/renanhangai/virtual-file-loader)
- [https://github.com/webpack/webpack/issues/5824](https://github.com/webpack/webpack/issues/5824)

## License

[MIT](LICENSE)
