const path = require('path');

module.exports = {
    entry: {
        bundle: path.resolve(__dirname, './src/index.js'),
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './dest'),
        publicPath: 'dest/',
    },
    module: {
        rules: [{
            test: /\.vue$/,
            loader: 'vue-loader',
        }, {
            test: /\.md$/,
            use: [{
                loader: 'vue-loader',
            }, {
                loader: path.resolve(__dirname, '../index.js'),
                options: {
                    wrapper: 'article',
                    markdown: {
                        langPrefix: 'lang-',
                    },
                    preprocess(source) {
                        return '**added by preprocess**\n\n------\n\n' + source;
                    },
                },
            }],
        }],
    },
    devServer: {
        historyApiFallback: true,
    },
};
