const resolve = require("path").resolve;
const fs = require("fs");
const webpack = require("webpack");

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
        }, {
            test: /\.md$/,
            use: [{
                loader: 'vue-loader',
            }, {
                loader: resolve(__dirname, "../index.js"),
                options: {
                    wrapper: 'article',
                    preprocess: function (source) {
                        return `
# added by preprocess
${source}
                        `;
                    },
                },
            }],
        }],
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true,
    }
};
