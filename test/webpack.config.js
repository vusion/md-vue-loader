const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

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
            use: [{
                loader: 'cache-loader',
            }, {
                loader: 'vue-loader',
            }],
        }, {
            test: /\.css$/,
            use: [
                'vue-style-loader',
                'css-loader',
            ],
        }, {
            test: /\.md$/,
            use: [
                {
                    loader: 'vue-loader',
                },
                {
                    loader: path.resolve(__dirname, '../index.js'),
                },
            ],
        }],
    },
    plugins: [
        new VueLoaderPlugin(),
    ],
    devServer: {
        historyApiFallback: true,
    },
};
