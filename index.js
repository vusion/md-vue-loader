const path = require('path');
const loaderUtils = require('loader-utils');
const parse = require('./src/parse');

module.exports = function (source) {
    // eslint-disable-next-line consistent-this
    const loaderContext = this;

    const query = this.resourceQuery ? loaderUtils.parseQuery(this.resourceQuery) : undefined;
    const options = Object.assign({}, loaderUtils.getOptions(this), query);
    delete options.component;

    const filename = path.basename(this.resourcePath);

    const descriptor = parse({
        source,
        filename,
        options,
        query,
        loaderContext,
    });

    if (query.component)
        return descriptor.componentMap.get(query.component);
    else
        return descriptor.main;
};
