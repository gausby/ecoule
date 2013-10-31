/* global require module */
'use strict';

var serial = require('operandi').serial;

function mockSource (config) {
    this.config = config;

    this.title = this.config.title || 'Mock source';
    this.initialize = config.initialize;
    this.refresh = config.refresh;
    this.entries = config.entries;

    this.refresh = config.refresh || function (done) {
        done(undefined, this.entries);
    };
}

module.exports = function (options) {
    return (new mockSource(options || {}));
};
