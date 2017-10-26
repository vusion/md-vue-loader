const compiler = require('./compiler.js');
const loader = function loader(source) {
    const result = `module.exports = "${compiler.call(this, source)}"`;
    return result;
};
module.exports = loader;