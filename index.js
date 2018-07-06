const loaderUtils = require('loader-utils');
const Parser = require('./src/Parser');

module.exports = function (source) {
    this.cacheable && this.cacheable();
    const options = loaderUtils.getOptions(this);
    const parser = new Parser(options, this);
    return `module.exports = "${parser.parse(source)}"`;
};
