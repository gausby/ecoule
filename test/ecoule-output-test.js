/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoule = require('../lib/ecoule'),
    outputs = require('../lib/outputs'),
    transformers = require('../lib/transformers'),
    mixin = require('./helpers/mixin'),
    mockTransformer = require('ecoule-transformer-mock'),
    mockOutput = require('./mocks/output')
;

var assert = buster.referee.assert;
var refute = buster.referee.refute;

var basicConfig = {};

buster.testCase('An output', {
    'should not return an error if no output is set': function (done) {
        var ecoule = new Ecoule(mixin(basicConfig, {
            transformers: [mockTransformer({
                outputs: []
            })]
        }));

        outputs.initialize.call(ecoule, function (err) {
            refute.defined(err);
            done();
        });
    },

    'should initialize an output that has an initialize function': function (done) {
        var test = false;

        var ecoule = new Ecoule(mixin(basicConfig, {
            transformers: [mockTransformer({
                outputs: [mockOutput({
                    initialize: function (done) {
                        test = true;
                        done();
                    }
                })]
            })]
        }));

        outputs.initialize.call(ecoule, function () {
            assert.isTrue(test);
            done();
        });
    },

    'should be able to initialize multiple outputs': function (done) {
        var foo = false, bar = false, baz = false;

        var ecoule = new Ecoule(mixin(basicConfig, {
            transformers: [mockTransformer({
                outputs: [
                    mockOutput({
                        initialize: function (done) {
                            foo = true;
                            done();
                        }
                    }),
                    mockOutput({
                        initialize: function (done) {
                            bar = true;
                            done();
                        }
                    }),
                    mockOutput(),
                    mockOutput({
                        initialize: function (done) {
                            baz = true;
                            done();
                        }
                    })
                ]
            })]
        }));

        outputs.initialize.call(ecoule, function () {
            assert.isTrue(foo);
            assert.isTrue(bar);
            assert.isTrue(baz);
            done();
        });
    },

    'should receive the output from a transformer': function (done) {
        var ecoule = new Ecoule({ transformers: [mockTransformer({
            execute: function(done) {
                done(undefined, [{foo: 'bar'}]);
            },
            outputs: [
                mockOutput({
                    execute: function (data, done) {
                        assert.defined(data);
                        assert.equals(data, [{foo: 'bar'}]);
                        done();
                    }
                })
            ]
        })]});

        transformers.executeAll.call(ecoule, function(err) {
            refute.defined(err);
            done();
        });
    }
});