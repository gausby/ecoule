/* global require module */
'use strict';

var pursuit = require('pursuit'),
    serial = require('operandi').serial,
    parallel = require('operandi').parallel,
    eachSerial = require('operandi').eachSerial,
    eachBatch = require('operandi').eachBatch,
    eachParallel = require('operandi').eachParallel
;

/**
 * Initialize every output attached to every transformer
 *
 * @method initialize
 * @async
 * @param {Function} done callback
 */
function initialize (done) {
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
}

module.exports = {
    initialize: initialize
};
