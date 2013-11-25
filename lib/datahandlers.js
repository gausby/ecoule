/* global require module */
'use strict';

var pursuit = require('pursuit'),
    serial = require('operandi').serial,
    parallel = require('operandi').parallel,
    eachSerial = require('operandi').eachSerial,
    eachBatch = require('operandi').eachBatch,
    eachParallel = require('operandi').eachParallel
;


// convenience functions
var hasHelpers = pursuit({
    helpers: {typeOf: 'object'}
});

var isValidDataHandler = pursuit({
    match: { typeOf: 'function' },
    execute: { typeOf: 'function' }
});


/**
 * Initialize every data-handler that is initializable.
 *
 * @method initializeDataHandlers
 * @async
 * @param {Function} done callback
 */
var initializeDataHandlers = function (done) {
    eachBatch(this.dataHandlers, function(dataHandler, key, done) {
        dataHandler = dataHandler[key];
        if (typeof dataHandler.match === 'object') {
            // compile the given object into a match-function
            dataHandler.match = pursuit(dataHandler.match);
        }

        if (typeof dataHandler.initialize === 'function') {
            return dataHandler.initialize(done);
        }
        else {
            return done();
        }
    }, 20, done);
};


/**
 * Run data handlers on every data-object that has been found. The data
 * handlers are set in the ecoule configuration.
 *
 * @method runDataHandlers
 * @async
 * @param {Function} done callback
 */
var runDataHandlers = function (done) {
    // run each data-handler on every data-object in every source
    parallel.call(this, [
        function(done) {
            var dataHandlers = (this.dataHandlers || []).filter(isValidDataHandler);

            if (dataHandlers.length === 0) {
                // no data handlers, do nothing
                done();
                return;
            }

            eachSerial(this.sources, function (sources, key, done) {
                var data = sources[key].data || [];

                if (data.length === 0) {
                    // no data, do nothing
                    done();
                    return;
                }

                eachSerial(dataHandlers, function(dataHandler, key, done) {
                    dataHandler = dataHandler[key];
                    eachBatch(data.filter(dataHandler.match), function(entry, key, done) {
                        dataHandler.execute(entry[key], done);
                    }, 10, done);
                }, done);
            }, done);
        },
        function (done) {
            eachSerial(
                this.transformers.filter(hasHelpers),
                function(transformer, current, done) {
                    eachSerial(transformer[current].helpers, function(helpers, current, done) {
                        runDataHandlers.call(helpers[current], done);
                    }, done);
                },
                done
            );
        }
    ], done);
};

module.exports = {
    initializeDataHandlers: initializeDataHandlers,
    runDataHandlers: runDataHandlers
};
