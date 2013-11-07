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

module.exports = Ecoule;


// convenience functions
var isEcouleInstance = pursuit({ instanceOf: Ecoule });
var hasHelpers = pursuit({ helpers: {typeOf: 'object'}});


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
}


/**
 * @method refresh
 * @async
 * @param {Function} done callback
 */
Ecoule.prototype.refresh = function (done) {
    serial.call(this, [
        this.initialize,
        this.refreshSources,
        this.runDataHandlers,
        this.runTransformers
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
        this.initializeSources,
        this.initializeDataHandlers,
        this.initializeTransformers,
        this.initializeOutputs
    ], done);
};


/**
 * Initialize any given source.
 *
 * @method initializeSources
 * @async
 * @param {Function} [done] callback
 */
Ecoule.prototype.initializeSources = function (done) {
    // do nothing if no sources has been set, and call the given callback
    if (! this.config.sources) {
        return (done||function(){})();
    }

    return eachParallel.call(this.sources, this.config.sources, function (sources, key, done) {
        // create a new source
        this[sources[key].title] = {};

        if (typeof sources[key].initialize === 'function') {
            // the source has an initialize function, trigger it now.
            return sources[key].initialize(done);
        }
        else {
            // skip to the next source if no initialize function is present.
            return done();
        }

    }, done);
};


/**
 * Initialize every data-handler that is initializable.
 *
 * @method initializeDataHandlers
 * @async
 * @param {Function} done callback
 */
Ecoule.prototype.initializeDataHandlers = function (done) {

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
 * Initialize every transformer that is initializable.
 *
 * @method initializeTransformers
 * @async
 * @param {Function} done callback
 */
Ecoule.prototype.initializeTransformers = function (done) {
    eachParallel(this.transformers, function (transformer, key, done) {
        transformer = transformer[key];

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
                if (typeof transformer.queries === 'object') {
                    return eachParallel(transformer.queries, function (queries, current, done) {
                        queries[current] = pursuit(queries[current]);
                        done();
                    }, done);
                }
                else {
                    return done();
                }
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
    }, done);
};


/**
 * Initialize every output attached to every transformer
 *
 * @method initializeOutputs
 * @async
 * @param {Function} done callback
 */
Ecoule.prototype.initializeOutputs = function (done) {
    eachBatch(this.transformers, function (transformer, key, done) {
        transformer = transformer[key];

        if (transformer.outputs && transformer.outputs.length) {
            eachBatch(transformer.outputs, function(output, key, done) {
                output = output[key];

                if (typeof output.initialize === 'function') {
                    output.initialize(done);
                }
                else {
                    done();
                }
            }, 2, done);
        }
        else {
            done();
        }
    }, 2, done);
};


/**
 * Refresh every source
 *
 * @method refreshSources
 * @async
 * @param {Function} done callback
 */
Ecoule.prototype.refreshSources = function (done) {
    var source = this.sources;

    // fetch the data from every source
    parallel.call(this, [
        function (done) {
            eachSerial(this.config.sources, function (sources, key, done) {
                var current = sources[key];

                // run every refresh on every source that has a refresh function
                if (typeof current === 'object' && typeof current.refresh === 'function') {
                    return current.refresh(function(err, output) {
                        if (! err) {
                            source[current.title] = output || [];
                        }

                        return done(err);
                    });
                }
                else {
                    return done();
                }
            }, done);
        },
        function (done) {
            if (this.transformers) {
                var transformers = this.transformers.filter(hasHelpers);
                return eachSerial(transformers, function(transformer, current, done) {
                    return eachSerial(transformer[current].helpers, function(helpers, current, done) {
                        return helpers[current].refreshSources(done);
                    }, done);
                }, done);
            }
            else {
                return done();
            }
        }
    ], done);

};


/**
 * Run data handlers on every data-object that has been found. The data
 * handlers are set in the ecoule configuration.
 *
 * @method runDataHandlers
 * @async
 * @param {Function} done callback
 */
Ecoule.prototype.runDataHandlers = function (done) {
    var sources = Object.keys(this.sources);

    // run each data-handler on every data-object in every source
    parallel.call(this, [
        function(done) {
            return eachSerial.call(this, sources, function (sources, key, done) {
                var source = this.sources[sources[key]];

                eachSerial.call(this, source, function (entries, key, done) {
                    var entry = entries[key];

                    // run each data-handler on each data-object
                    eachBatch(this.dataHandlers, function (dataHandler, key, done) {
                        // check whether or not it should do something to this data-object
                        if (dataHandler[key].match(entry)) {
                            return dataHandler[key].execute(entry, function(err) {
                                // pass the error object along if it is defined
                                return done(err);
                            });
                        }
                        else {
                            // return if this data-handler does not match the data-object
                            return done();
                        }

                    }, 10, done);
                }, done);
            }, done);
        },
        function (done) {
            var transformers = this.transformers.filter(hasHelpers);

            return eachSerial(transformers, function(transformer, current, done) {
                return eachSerial(transformer[current].helpers, function(helpers, current, done) {
                    return helpers[current].runDataHandlers(done);
                }, done);
            }, done);
        }
    ], done);
};


/**
 * Transform every file with the specified transformers.
 *
 * @method runTransformers
 * @async
 * @param {Function} done callback
 */
Ecoule.prototype.runTransformers = function (done) {
    eachSerial.call(this, this.transformers, function (transformer, key, done) {
        var sources = transformer.sources || Object.keys(this.sources),
            queries = []
        ;

        transformer = transformer[key];
        transformer.data = {};

        serial.call(this, [
            function (done) {
                if (hasHelpers(transformer)) {
                    eachSerial(transformer.helpers, function(helpers, current, done) {
                        helpers[current].runTransformers(done);
                    }, done);
                }
                else {
                    done();
                }
            },

            // gather files form sources
            function (done) {
                return eachSerial.call(this, transformer.queries, function(queries, query, done) {
                    // a place to store the files
                    transformer.data[query] = [];

                    eachParallel.call(this, sources, function(source, key, done) {
                        source = this.sources[source[key]];

                        if (typeof transformer.queries[query] === 'function') {
                            // if the transformer has a query function, it
                            // will use it to gather all the entries that
                            // matches.
                            transformer.data[query] = transformer.data[query].concat(
                                source.filter(transformer.queries[query])
                            );
                        }
                        else {
                            // if not it will just pass all the entries to
                            // the files.
                            transformer.data[query] = transformer.data[query].concat(source);
                        }

                        return done();
                    }, done);
                }, done);
            },

            // run pre processors
            function (done) {
                if (typeof transformer.preprocessors === 'object') {
                    return serial.call(transformer, transformer.preprocessors, done);
                }
                else {
                    // no pre processors found
                    return done();
                }
            },

            // run transformer
            function (done) {
                transformer.execute.call(transformer, function (err, data) {
                    if (err) {
                        return done(err);
                    }

                    // send the output of the transformer to the attached outputs
                    if (transformer.outputs) {
                        return serial([
                            // run post processors on the output ---------
                            function(done) {
                                if (typeof transformer.postprocessors === 'object') {
                                    return serial.call(data, transformer.postprocessors, done);
                                }

                                // no post processors found, skip
                                return done();
                            },
                            // send the data to the outputs --------------
                            function(done) {
                                eachBatch(transformer.outputs, function(output, key, done) {
                                    output = output[key];

                                    if (typeof output.execute === 'function') {
                                        return output.execute(data, done);
                                    }
                                    else {
                                        return done();
                                    }
                                }, 2, done);
                            }
                        ], done);
                    }
                    else {
                        // no outputs assigned to this transformer
                        return done();
                    }
                });
            }
        ], done);
    }, done);
};
