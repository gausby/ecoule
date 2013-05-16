/* global module */
'use strict';

var config;

var transformer = function (done) {
    done();
};

module.exports = function (options) {
    options = options || {};

    config = options;

    return {
        name: 'mock',
        'mime-type': 'text/html',
        extension: '.html',
        execute: options.execute || transformer,
        queries: options.queries,
        sources: options.sources,
        preprocessors: options.preprocessors,
        postprocessors: options.postprocessors,
        initialize: options.initialize,
        outputs: options.outputs || []
    };
};
