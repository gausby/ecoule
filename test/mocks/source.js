/* global require module */
'use strict';

var serial = require('operandi').serial;

function mockSource (config) {
    this.config = config;

    // if (! ('source' in this.config)) {
    //     this.config.source = './mock-source/';
    // }

    this.title = this.config.title || 'Mock source';
}

mockSource.prototype.refresh = function (done) {
    done(undefined, this.config.entries);
};

mockSource.prototype.initialize = function(done) {
    done();
};

module.exports = function (options) {
    return (new mockSource(options || {}));
};
