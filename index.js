const path = require('path');
const loaderUtils = require('loader-utils');
const parse = require('./src/parse');

module.exports = function (source) {
    // eslint-disable-next-line consistent-this
    const loaderContext = this;

    const query = this.resourceQuery ? loaderUtils.parseQuery(this.resourceQuery) : undefined;
    const options = loaderUtils.getOptions(this) || {};

    const filename = path.basename(this.resourcePath);

    const descriptor = parse({
        source,
        filename,
        options,
        query,
        loaderContext,
    });

    if (query && query.component)
        return descriptor.componentMap.get(query.component);
    else
        return descriptor.main;
};
