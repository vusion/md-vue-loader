# vue-markdown-html-loader

[![npm](https://img.shields.io/npm/v/vue-markdown-html-loader.svg?style=flat-square)](https://www.npmjs.com/package/vue-markdown-html-loader)
![vue](https://img.shields.io/badge/vue-2.x-4fc08d.svg?colorA=2c3e50&style=flat-square)

> Convert Markdown file to Vue Component using markdown-it.inspire from [vue-markdown-loader](https://github.com/QingWei-Li/vue-markdown-loader) and [virtual-file-loader](https://github.com/renanhangai/virtual-file-loader) and [https://github.com/webpack/webpack/issues/5824](https://github.com/webpack/webpack/issues/5824).

## Installation

```bash
npm i vue-markdown-html-loader -D
```

## Feature
- Hot reload
- Write vue script
- Code highlight


## Usage
[Documentation: Using loaders](https://webpack.js.org/concepts/loaders/)

`webpack.config.js` file:

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.md$/,
        use: [
          {
            loader: 'vue-loader',
          },
          {
            loader: resolve(__dirname, "../index.js"),
            options: {
              wrapper: 'article',
              markdownIt: {
                  langPrefix: 'lang-',
                  html: true,
              },
              markdownItPlugins: [
                  [iterator, 'link_converter', 'link_open', (tokens, idx) => tokens[idx].tag = 'u-link'],
                  [iterator, 'link_converter', 'link_close', (tokens, idx) => tokens[idx].tag = 'u-link'],
              ],
              preprocess: function (markdownIt, source) {
                return `
                  # added by preprocess 
                  ${source}
                `;
              },
            },
          },
        ],
      }
    ]
  }
};
```

## Options

### wrapper

You can customize wrapper tag no matter html element tag or vue component tag. Default is 'section'

```js
{
  test: /\.md$/,
  loader: 'vue-markdown-html-loader',
  options: {
    wrapper: 'article',
  }
}
```

### markdownIt

reference [markdown-it](https://github.com/markdown-it/markdown-it#init-with-presets-and-options)
```javascript
{
  module: {
    rules: [
      {
        test: /\.md$/,
        loader: 'vue-markdown-html-loader',
        options: {
          wrapper: 'article',
          markdownIt: {
              langPrefix: 'lang-',
              html: true,
          },
          markdownItPlugins: [
            [iterator, 'link_converter', 'link_open', (tokens, idx) => tokens[idx].tag = 'u-link'],
            [iterator, 'link_converter', 'link_close', (tokens, idx) => tokens[idx].tag = 'u-link'],
          ],
        }
      }
    ]
  }
}
```

Or you can customize markdown-it
```javascript
var markdown = require('markdown-it')({
  html: true,
  breaks: true
})

markdown
  .use(plugin1)
  .use(plugin2, opts, ...)
  .use(plugin3);

module.exports = {
  module: {
    rules: [
      {
        test: /\.md$/,
        loader: 'vue-markdown-html-loader',
        options: {
          markdownIt: markdown,
        }
      }
    ]
  }
};
```

## License
MIT

