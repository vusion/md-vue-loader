const loaderUtils = require('loader-utils');
const Parser = require('./src/Parser_WebpackFS');

module.exports = function (source) {
    this.cacheable && this.cacheable();
    const params = this.resourceQuery ? loaderUtils.parseQuery(this.resourceQuery) : undefined;
    const options = Object.assign({}, loaderUtils.getOptions(this), params);
    const parser = new Parser(options, this);
    return `module.exports = "${parser.parse(source)}"`;
};
