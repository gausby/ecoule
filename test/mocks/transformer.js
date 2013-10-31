/* global module */
'use strict';

var Transformer = function (config) {
    this.initialize = config.initialize;
    this.execute = config.execute;
    this.queries = config.queries || {};
    this.outputs = config.outputs || [];
    this.preprocessors = config.preprocessors;
    this.postprocessors = config.postprocessors;
    this.helpers = config.helpers;
};

module.exports = function (config) {
    return new Transformer(config || {});
};
