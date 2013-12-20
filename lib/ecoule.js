/* global require module */
'use strict';

var serial = require('operandi').serial,
    parallel = require('operandi').parallel,

    sources = require('./ecoule-sources'),
    datahandlers = require('./ecoule-data-handlers'),
    transformers = require('./ecoule-transformers'),
    outputs = require('./ecoule-transformer-outputs')
;

module.exports = Ecoule;

/**
 * Ecoule - A static data transformation engine framework of sorts.
 *
 * @class Ecoule
 * @constructor
 * @param {Object} [config={}] Configurations for the ecoule object
 * @param {string} [config.title=Untitled] the title of the blog
 * @param {string} [config.base] the base destination of the output
 * @param {Object} [config.transformers=[]]
 * @param {Array} [config.data-handlers]
 */
function Ecoule(config) {
    this.config = config || {};
    this.transformers = this.config.transformers || [];
    this.dataHandlers = this.config['data-handlers'];

    this.sources = {};

    this.config.sources = this.config.sources || [];
}


/**
 * Run initialize on everything that can be initialized
 *
 * @method initialize
 * @async
 * @param {Function} [done] callback
 */
Ecoule.prototype.initialize = function (done) {
    parallel.call(this, [
        sources.initializeAll,
        datahandlers.initialize,
        transformers.initializeAll,
        outputs.initialize
    ], done);
};


/**
 * @method refresh
 * @async
 * @param {Function} done callback
 */
Ecoule.prototype.refresh = function (done) {
    serial.call(this, [
        this.initialize,
        sources.refreshAll,
        datahandlers.execute,
        transformers.executeAll
    ], done);
};
