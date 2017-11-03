const compiler = require('./compiler.js');
const loader = function loader(source) {
    this.cacheable && this.cacheable();
    const result = `module.exports = "${compiler.call(this, source)}"`;
    return result;
};
module.exports = loader;
