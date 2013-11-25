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
 * Initialize any given source.
 *
 * @method initialize
 * @async
 * @param {Function} [done] callback
 */
var initialize = function (done) {
    eachParallel(this.config.sources.filter(hasInitializer), function (sources, key, done) {
        // the source has an initialize function, trigger it now.
        sources[key].initialize(done);
    }, (done||function(){}));
};

/**
 * Refresh every source
 *
 * @method refreshSources
 * @async
 * @param {Function} done callback
 */
var refreshSource = function (source, done) {
    if (hasRefreshFunction(source)) {
        return source.refresh(function(err, output) {
            if (isValidSourceOutput(arguments)) {
                source.store.data = output;
            }

            return done(err);
        });
    }
    else {
        // @should we throw an error if the source does not have an refresh function?
        return done(new Error('Source did not have an refresh function'));
    }
};


var refreshSources = function (done) {
    // fetch the data from every source
    parallel.call(this, [
        function (done) {
            eachSerial.call(this,
                this.config.sources.filter(hasRefreshFunction),
                function(sources, key, done) {
                    refreshSource.call(this, sources[key], done);
                },
                done
            );
        },
        function (done) {
            if (this.transformers) {
                var transformers = this.transformers.filter(hasHelpers);

                eachSerial(transformers, function(transformer, current, done) {
                    eachSerial(transformer[current].helpers, function(helpers, current, done) {
                        refreshSources.call(helpers[current], done);
                    }, done);
                }, done);
            }
            else {
                done();
            }
        }
    ], done);
};


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
    store: store,
    initializeSources: initialize,
    refreshSource: refreshSource,
    refreshSources: refreshSources
};