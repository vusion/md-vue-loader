const hash = require('hash-sum');
const cache = new (require('lru-cache'))(100);
const Parser = require('./Parser');

module.exports = function parse(params) {
    const {
        source,
        filename = '',
        options = {},
        query = {},
        loaderContext,
    } = params;

    const cacheKey = hash(filename + source + JSON.stringify(options));
    let output = cache.get(cacheKey);
    if (output)
        return output;

    // 解析 Markdown
    const parser = new Parser(Object.assign({}, options, query), loaderContext);
    output = parser.parse(source);
    cache.set(cacheKey, output);
    return output;
};
