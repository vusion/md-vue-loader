const path = require('path');

module.exports = {
    chainWebpack: config => {
        config.entry.bundle = path.resolve(__dirname, './src/index.js');
        config.outputDir = {
            filename: '[name].js',
            path: path.resolve(__dirname, './dest'),
            publicPath: 'dest/',
        };
        config.devServer.historyApiFallback(true);
        config.module
            .rule('md')
            .test(/\.md$/)
            .use('vue')
                .loader('vue-loader')
                .end()
            .use('md')
                .loader(path.resolve(__dirname, '../index.js'))
                .end()
    },
}