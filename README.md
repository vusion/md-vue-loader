# vue-markdown-html-loader

[![npm](https://img.shields.io/npm/v/vue-markdown-html-loader.svg?style=flat-square)](https://www.npmjs.com/package/vue-markdown-html-loader)
![vue](https://img.shields.io/badge/vue-2.x-4fc08d.svg?colorA=2c3e50&style=flat-square)

> Convert Markdown file to Vue Component using markdown-it.inspire from [vue-markdown-loader](https://github.com/QingWei-Li/vue-markdown-loader).

## Installation

```bash
npm i vue-markdown-loader -D
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
                    loader: 'vue-markdown-html-loader',
                    options: {
                        cacheDir: path.resolve(__dirname, './cache'),
                        langPrefix: 'lang-',
                        html: true,
                        wrapper: 'u-article',
                        use: [
                            [iterator, 'link_converter', 'link_open', (tokens, idx) => tokens[idx].tag = 'u-link'],
                            [iterator, 'link_converter', 'link_close', (tokens, idx) => tokens[idx].tag = 'u-link'],
                        ],
                    },
                },
            ],
        },
    ]
  }
};
```

## Options

### cacheDir(require)
save the vue componets from `*.md`. It will read code block like this:
```vue
//content
```
and write it in new file.

### wrapper

You can customize wrapper tag no matter html element tag or vue component tag. Default is 'section'

```js
{
  test: /\.md$/,
  loader: 'vue-markdown-loader',
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
          // markdown-it config
          preset: 'default',
          breaks: true,
          preprocess: function(markdownIt, source) {
            // do any thing
            return source
          },
          use: [
            /* markdown-it plugin */
            require('markdown-it-xxx'),
            /* or */
            [require('markdown-it-xxx'), 'this is options']
          ]
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
        loader: 'vue-markdown-loader',
        options: markdown
      }
    ]
  }
};
```

## License
MIT

