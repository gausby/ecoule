/* global require module */
'use strict';

var pursuit = require('pursuit'),
    serial = require('operandi').serial,
    parallel = require('operandi').parallel,
    eachSerial = require('operandi').eachSerial,
    eachBatch = require('operandi').eachBatch,
    eachParallel = require('operandi').eachParallel,

    // Used to pass the result of a sub ecoule process to its
    // parent transformer
    outputObject = require('ecoule-output-object-reference'),

    sources = require('./sources'),
    outputs = require('./outputs'),
    datahandlers = require('./datahandlers'),
    transformers = require('./transformers')
;

module.exports = Ecoule;

/**
 * Ecoule - A static blog engine framework of sorts.
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

    if (this.config.sources) {
        this.config.sources.forEach(function (source) {
            this.sources[source.title] = sources.store();
            source.store = this.sources[source.title];
        }, this);
    }
    else {
        this.config.sources = [];
    }
}


/**
 * @method refresh
 * @async
 * @param {Function} done callback
 */
Ecoule.prototype.refresh = function (done) {
    serial.call(this, [
        this.initialize,
        sources.refreshSources,
        datahandlers.runDataHandlers,
        transformers.runTransformers
    ], done);
};


/**
 * Run initialize on everything that can be initialized
 *
 * @method initialize
 * @async
 * @param {Function} [done] callback
 */
Ecoule.prototype.initialize = function (done) {
    parallel.call(this, [
        sources.initializeSources,
        datahandlers.initializeDataHandlers,
        transformers.initializeTransformers,
        outputs.initializeOutputs
    ], done);
};
