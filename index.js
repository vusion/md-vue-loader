const compile = require('./src/compile');

module.exports = function (source) {
    this.cacheable && this.cacheable();
    return `module.exports = "${compile.call(this, source)}"`;
};
