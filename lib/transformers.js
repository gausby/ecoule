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
    outputObject = require('ecoule-output-object-reference')
;


// convenience functions
var hasHelpers = pursuit({
    helpers: {typeOf: 'object'}
});


/**
 * Initialize a given transformer and its helpers.
 *
 * @method initialize
 * @async
 * @param {Object} transformer transformer to initialize
 * @param {Function} done callback
 */
function initialize (transformer, done) {
    parallel([
        // initialize transformers
        function (done) {
            if (typeof transformer.initialize === 'function') {
                return transformer.initialize(done);
            }
            else {
                // skip to the next thing if no initialize function is present
                return done();
            }
        },
        // compile queries
        function (done) {
            return eachParallel(transformer.queries, function (queries, current, done) {
                queries[current] = pursuit(queries[current]);
                done();
            }, done);
        },
        // initialize sub-ecoules
        function (done) {
            if (typeof transformer.helpers === 'object') {
                var setup = function (variables, current, done) {
                    // make sure we are not overwriting an already set variable, or a
                    // reserved transformer key-word
                    if (typeof transformer[current] === 'undefined') {
                        transformer[current] = {};
                    }
                    else {
                        return done(new Error(
                            'Sub ecoule would output data to an already used variable'
                        ));
                    }

                    // overwrite the output, if set, with an object reference output
                    // and make the output of the sub-ecoule available to the parent
                    // transformer on the variable set in `current`
                    variables[current].transformers[0].outputs = [
                        outputObject({ result: transformer[current] })
                    ];

                    // run the initialize functions on the sub-ecoule
                    if (typeof variables[current].initialize === 'function') {
                        return variables[current].initialize(done);
                    }
                    else {
                        // everythings fine, there is no initialize methods though...
                        return done();
                    }
                };

                return eachBatch(transformer.helpers, setup, 2, done);
            }
            else {
                return done();
            }
        }
    ], done);
}


/**
 * Initialize every configured transformer.
 *
 * @method initializeAll
 * @async
 * @param {Function} done callback
 */
function initializeAll (done) {
    eachParallel.call(this, this.transformers, function (transformer, key, done) {
        initialize.call(this, transformer[key], done);
    }, done);
}


/**
 * Transform every file with the specified transformers.
 *
 * @method executeAll
 * @async
 * @param {Function} done callback
 */
function executeAll (done) {
    eachSerial.call(this, this.transformers, function (transformer, key, done) {
        execute.call(this, transformer[key], done);
    }, done);
}


/**
 * Transform every file with a specified transformer.
 *
 * @method execute
 * @async
 * @param {Object} transformer
 * @param {Function} done callback
 */
function execute (transformer, done) {
    serial.call(this, [
        // run attached helpers
        function (done) {
            if (hasHelpers(transformer)) {
                eachSerial(transformer.helpers, function(helpers, current, done) {
                    executeAll.call(helpers[current], done);
                }, done);
            }
            else {
                done();
            }
        },

        // gather files form sources
        function (done) {
            var sources = transformer.sources || Object.keys(this.sources);
            transformer.data = {};

            return eachSerial.call(this, transformer.queries, function(queries, query, done) {
                // a place to store the files
                transformer.data[query] = [];

                eachSerial.call(this, sources, function(sources, key, done) {
                    // use the defined query functions to gather all the matches
                    transformer.data[query] = transformer.data[query].concat(
                        this.sources[sources[key]].find(transformer.queries[query])
                    );

                    return done();
                }, done);
            }, done);
        },

        // run pre processors
        function (done) {
            serial.call(transformer, transformer.preprocessors || [], done);
        },

        // run transformer
        function (done) {
            transformer.execute.call(transformer, function (err, data) {
                if (err) {
                    return done(err);
                }

                // send the output of the transformer to the attached outputs
                return serial([
                    // run post processors on the output
                    function(done) {
                        serial.call(data, transformer.postprocessors, done);
                    },
                    // send the data to the outputs
                    function(done) {
                        eachBatch(transformer.outputs, function(output, key, done) {
                            if (typeof output[key].execute === 'function') {
                                return output[key].execute(data, done);
                            }
                            else {
                                return done();
                            }
                        }, 2, done);
                    }
                ], done);
            });
        }
    ], done);
}


module.exports = {
    initialize: initialize,
    initializeAll: initializeAll,
    execute: execute,
    executeAll: executeAll
};