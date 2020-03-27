const hash = require('hash-sum');
const cache = new (require('lru-cache'))(100);
const Parser = require('./Parser');

module.exports = function parse(options) {
    const {
        source,
        filename = '',
        compilerParseOptions = {},
        compilerParseQuery = {},
        loaderContext,
    } = options;
    const cacheKey = hash(
        filename + source + JSON.stringify(compilerParseOptions)
    );
    console.log(cacheKey);
    let output = cache.get(cacheKey);
    if (output)
        return output;
    // 编译 markdown
    const compiler = new Parser(Object.assign({}, compilerParseOptions, compilerParseQuery), loaderContext);
    output = compiler.parse(source);
    cache.set(cacheKey, output);
    return output;
};
