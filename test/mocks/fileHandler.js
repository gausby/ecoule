/* global require module */
'use strict';

function mockDataHandler (config) {
    this.config = config;

    this.name = config.name || 'Mock File Handler';
    this.type = config.type || 'mock';
    this.initialize = config.initialize;
    this.match = config.match;
    this.execute = config.execute;
}

module.exports = function (options) {
    return (new mockDataHandler(options || {}));
};
