/* global require module */
'use strict';

var query = require('pursuit'),
    serial = require('operandi').serial,
    parallel = require('operandi').parallel,
    eachSerial = require('operandi').eachSerial,
    eachBatch = require('operandi').eachBatch,
    eachParallel = require('operandi').eachParallel
;

module.exports = Ecoute;


/**
 * Ecoute - A static blog engine framework of sorts.
 *
 * @class Ecoute
 * @constructor
 * @param {Object} [config={}] Configurations for the ecoute object
 * @param {string} [config.title=Untitled] the title of the blog
 * @param {string} [config.base] the base destination of the output
 * @param {Object} [config.transformers=[]]
 * @param {Array} [config.data-handlers]
 */
function Ecoute(config) {
    this.config = config || {};
    this.transformers = this.config.transformers || [];
    this.dataHandlers = this.config['data-handlers'];

    this.sources = {};
}


/**
 * @method refresh
 * @async
 * @param {Error|Null} err
 * @param {Function} done callback
 */
Ecoute.prototype.refresh = function (done) {
    serial.call(this, [
        function (done) {
            parallel.call(this, [
                this.initializeSources,
                this.initializeDataHandlers,
                this.initializeTransformers,
                this.initializeOutputs
            ], done);
        },

        this.refreshSources,

        this.runDataHandlers,
        this.runTransformers
        // run outputters
    ], done);
};


/**
 * Initialize any given source.
 *
 * @method initializeSources
 * @async
 * @param {Function} [done] callback
 */
Ecoute.prototype.initializeSources = function (done) {
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
Ecoute.prototype.initializeDataHandlers = function (done) {

    eachBatch(this.dataHandlers, function(dataHandler, key, done) {
        dataHandler = dataHandler[key];

        if (typeof dataHandler.match === 'object') {
            // compile the given object into a match-function
            dataHandler.match = query(dataHandler.match);
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
Ecoute.prototype.initializeTransformers = function (done) {
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
                    return eachParallel(Object.keys(transformer.queries), function (keys, key, done) {
                        transformer.queries[keys[key]] = query(transformer.queries[keys[key]]);
                        done();
                    }, done);
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
Ecoute.prototype.initializeOutputs = function (done) {
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
Ecoute.prototype.refreshSources = function (done) {
    var source = this.sources;

    // fetch the data from every source
    eachSerial(this.config.sources, function (sources, key, done) {
        var current = sources[key];

        // run every refresh on every source that has a refresh function
        if (typeof current === 'object' && typeof current.refresh === 'function') {
            return current.refresh(function(err, output) {
                if (err) {
                    return done(err);
                }

                source[current.title] = output || [];

                return done();
            });
        }
        else {
            return done();
        }
    }, done);
};


/**
 * Run data handlers on every data-object that has been found. The data
 * handlers are set in the blog configuration.
 *
 * @method runDataHandlers
 * @async
 * @param {Function} done callback
 */
Ecoute.prototype.runDataHandlers = function (done) {
    var sources = Object.keys(this.sources);

    // bail out if no data-handlers has been configured
    if (! this.dataHandlers) {
        return done();
    }

    // run each data-handler on every data-object in every source
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
};


/**
 * Transform every file with the specified transformers.
 *
 * @method runTransformers
 * @async
 * @param {Function} done callback
 */
Ecoute.prototype.runTransformers = function (done) {
    eachSerial.call(this, this.transformers, function (transformer, key, done) {
        var sources = transformer.sources || Object.keys(this.sources),
            queries = []
        ;

        transformer = transformer[key];

        if (typeof transformer.queries === 'object') {
            queries = Object.keys(transformer.queries);
        }

        serial.call(this, [
            // gather files form sources
            function (done) {
                if (queries.length === 0) {
                    return done();
                }

                return eachSerial.call(this, queries, function(query, key, done) {
                    query = query[key];

                    // a place to store the files
                    transformer[query] = [];

                    eachParallel.call(this, sources, function(source, key, done) {
                        source = this.sources[source[key]];

                        if (typeof transformer.queries[query] === 'function') {
                            // if the transformer has a query function, it
                            // will use it to gather all the entries that
                            // matches.
                            transformer[query] = transformer[query].concat(
                                source.filter(transformer.queries[query])
                            );
                        }
                        else {
                            // if not it will just pass all the entries to
                            // the files.
                            transformer[query] = transformer[query].concat(source);
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
                        return eachBatch(transformer.outputs, function(output, key, done) {
                            output = output[key];

                            if (typeof output.execute === 'function') {
                                output.execute(data, done);
                            }
                            else {
                                done();
                            }
                        }, 2, done);
                    }
                    else {
                        // no outputs assigned to this transformer
                        return done();
                    }
                });
            },

            // run post processors
            // @todo this should only touch the output of the transformer
            function (done) {
                if (typeof transformer.postprocessors === 'object') {
                    return serial.call(transformer, transformer.postprocessors, done);
                }

                // no post processors found, skip
                return done();
            }
        ], done);
    }, done);
};
