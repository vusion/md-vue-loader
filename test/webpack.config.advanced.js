const resolve = require('path').resolve;
const cheerio = require('cheerio');
const iterator = require('markdown-it-for-inline');

module.exports = {
    entry: resolve(__dirname, './src/index.js'),
    output: {
        path: resolve(__dirname, './dist'),
        publicPath: '/dist/',
        filename: 'build.js',
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
                loader: resolve(__dirname, '../index.js'),
                options: {
                    wrapper: 'u-article',
                    liveProcess(live, code) {
                        return `<div class="u-example"><div>${live}</div><div slot="code"></div></div>\n\n${code}`;
                    },
                    postprocess(result) {
                        const $ = cheerio.load(result, {
                            normalizeWhitespace: false,
                            decodeEntities: false,
                            lowerCaseAttributeNames: false,
                            lowerCaseTags: false,
                        });

                        $('div.u-example').each(function () {
                            const $this = $(this);
                            $this.next().appendTo($this.children().last());
                            this.tagName = 'u-example';
                            $this.removeClass();
                        });

                        return $.html();
                    },
                    plugins: [
                        [iterator, 'link_converter', 'link_open', (tokens, idx) => tokens[idx].tag = 'u-link'],
                        [iterator, 'link_converter', 'link_close', (tokens, idx) => tokens[idx].tag = 'u-link'],
                    ],
                },
            }],
        }],
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true,
    },
};
