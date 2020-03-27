const path = require('path');
const hash = require('hash-sum');
const qs = require('querystring');
const MarkdownIt = require('markdown-it');
const loaderUtils = require('loader-utils');
const parse = require('./src/parse');
module.exports = function (source) {
    const loaderContext = this;
    const stringifyRequest = (r) => loaderUtils.stringifyRequest(loaderContext, r);

    const {
        target,
        request,
        minimize,
        sourceMap,
        rootContext,
        resourcePath,
        resourceQuery,
    } = loaderContext;

    const rawQuery = resourceQuery.slice(1);
    const inheritQuery = `&${rawQuery}`;
    const incomingQuery = qs.parse(rawQuery);

    const options = loaderUtils.getOptions(loaderContext) || {};
    const isProduction = options.productionMode || minimize || process.env.NODE_ENV === 'production';

    const filename = path.basename(resourcePath);
    const context = rootContext || process.cwd();
    const sourceRoot = path.dirname(path.relative(context, resourcePath));

    const descriptor = parse({
        source,
        filename,
        compilerParseOptions: options,
        compilerParseQuery: incomingQuery,
        loaderContext,
    });

    if (incomingQuery.part) {
        return descriptor.component(incomingQuery.comp);
    }

    return descriptor.main;
};
