/* global require module */
'use strict';

var pursuit = require('pursuit'),
    serial = require('operandi').serial,
    parallel = require('operandi').parallel,
    eachSerial = require('operandi').eachSerial,
    eachParallel = require('operandi').eachParallel,
    eachBatch = require('operandi').eachBatch
;

// convenience functions
var hasHelpers = pursuit({
    helpers: { typeOf: 'object' }
});

var hasInitializer = pursuit({
    initialize: { typeOf: 'function' }
});

var hasRefreshFunction = pursuit({
    refresh: { typeOf: 'function' }
});

var isValidSourceOutput = pursuit({
    0: {typeOf: 'undefined'},
    1: {typeOf: 'array'}
});


/**
 * Initialize a specific source.
 *
 * @method initialize
 * @async
 * @param {Object} [source] ecoule source to initialize
 * @param {Function} [done] callback
 */
function initialize (source, done) {
    // create a data store and link it up for easy access
    this.sources[source.title] = store();
    source.store = this.sources[source.title];

    serial([
        // initialize itself
        function (done) {
            if (hasInitializer(source)) {
                // the source has an initialize function, trigger it now.
                source.initialize(done);
            }
            else {
                done();
            }
        },
        // initialize helpers
        function (done) {
            if (hasHelpers(source)) {
                if (source.sources !== undefined) {
                    return done(new Error([
                        'sources is a reserved keyword when the source has helpers'
                    ].join('')));
                }

                // create a local sources store
                source.sources = {};

                eachBatch(source.helpers, function(helpers, key, done) {
                    initialize.call(source, helpers[key], done);
                }, 2, done);
            }
            else {
                done();
            }

            return undefined;
        }
    ], done);
}


/**
 * Initialize all the configured sources.
 *
 * @method initializeAll
 * @async
 * @param {Function} [done] callback
 */
function initializeAll (done) {
    eachParallel.call(this, this.config.sources, function (sources, key, done) {
        initialize.call(this, sources[key], done);
    }, (done||function(){}));
}


/**
 * Run an optional function before refresh is triggered.
 * Use this to connect to a server, or other post refresh
 * operations.
 *
 * @method runBefore
 * @async
 * @param {Function} [done] callback
 */
function runBefore (done) {
    if (typeof this.before === 'function') {
        this.before(done);
    }
    else {
        done();
    }
}


/**
 * Run an optional function after refresh has been triggered.
 * Use this to disconnect from a server, or other post refresh
 * operations.
 *
 * @method runAfter
 * @async
 * @param {Function} [done] callback
 */
function runAfter (done) {
    if (typeof this.after === 'function') {
        this.after(done);
    }
    else {
        done();
    }
}


/**
 * Refresh a given source
 *
 * @method refresh
 * @async
 * @param {Function} done callback
 */
function refresh (source, done) {
    if (hasRefreshFunction(source)) {
        serial.call(source, [
            function (done) {
                if (hasHelpers(source)) {
                    eachSerial.call(
                        source,
                        source.helpers.filter(hasRefreshFunction),
                        function(sources, key, done) {
                            refresh.call(this, sources[key], done);
                        }, done
                    );
                }
                else {
                    done();
                }
            },
            runBefore,
            function (done) {
                source.refresh(function(err, output) {
                    if (isValidSourceOutput(arguments)) {
                        source.store.data = output;
                    }

                    done(err);
                });
            },
            runAfter
        ], done);
    }
    else {
        // @should we throw an error if the source does not have an refresh function?
        done(new Error('Source did not have an refresh function'));
    }
}


/**
 * Refresh every source
 *
 * @method refreshAll
 * @async
 * @param {Function} done callback
 */
function refreshAll (done) {
    // fetch the data from every source
    parallel.call(this, [
        function (done) {
            eachSerial.call(this,
                this.config.sources.filter(hasRefreshFunction),
                function(sources, key, done) {
                    refresh.call(this, sources[key], done);
                },
                done
            );
        },
        function (done) {
            if (this.transformers) {
                var transformers = this.transformers.filter(hasHelpers);

                eachSerial(transformers, function(transformer, current, done) {
                    eachSerial(transformer[current].helpers, function(helpers, current, done) {
                        refreshAll.call(helpers[current], done);
                    }, done);
                }, done);
            }
            else {
                done();
            }
        }
    ], done);
}


// source output data store
function store () {
    var _data = [];

    return {
        set data (input) {
            if (typeof input === 'object') {
                _data = input;
            }
            else {
                throw new Error('Input should be an object');
            }
        },

        get data () {
            return _data;
        },

        find: function (query) {
            return (typeof query === 'function') ? _data.filter(query) : _data;
        }
    };
}


module.exports = {
    initialize: initialize,
    initializeAll: initializeAll,
    refresh: refresh,
    refreshAll: refreshAll
};
