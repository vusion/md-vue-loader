const resolve = require("path").resolve;
const fs = require("fs");
const webpack = require("webpack");
const iterator = require('markdown-it-for-inline');
const markdown = require('markdown-it')({
    html: true,
    breaks: true
})

const cacheDir = resolve(__dirname, './cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}
// markdown
//     .use(function plugin1(params) {
//         return params;
//     });
markdown.cacheDir = cacheDir;

module.exports = {
    entry: resolve(__dirname, "./src/index.js"),
    output: {
        path: resolve(__dirname, "./dist"),
        publicPath: "/dist/",
        filename: "build.js"
    },
    module: {
        rules: [{
                test: /\.vue$/,
                loader: "vue-loader"
            },
            {
                test: /\.md$/,
                use: [{
                        loader: 'vue-loader',
                    },
                    {
                        loader: resolve(__dirname, "../index.js"),
                        options: {
                            cacheDir: cacheDir,
                            langPrefix: 'lang-',
                            html: true,
                            wrapper: 'article',
                            use: [
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
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true
    }
};