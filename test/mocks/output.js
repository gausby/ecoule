/* global require module */
'use strict';

var serial = require('operandi').serial;

function mockOutput (config) {
    this.config = config;
    this.initialize = config.initialize;
    this.execute = config.execute;
}

module.exports = function (options) {
    return (new mockOutput(options || {}));
};
