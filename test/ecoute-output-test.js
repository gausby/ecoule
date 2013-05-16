/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoute = require('../lib/ecoute'),
    mixin = require('./helpers/mixin'),
    mockTransformer = require('./mocks/transformer'),
    mockOutput = require('./mocks/output')
;

var assert = buster.assertions.assert;
var refute = buster.assertions.refute;

var basicConfig = {};

buster.testCase('An output', {
    'should not return an error if no output is set': function (done) {
        var ecoute = new Ecoute(mixin(basicConfig, {
            transformers: [mockTransformer({
                outputs: []
            })]
        }));

        ecoute.initializeOutputs(function (err) {
            refute.defined(err);
            done();
        });
    },

    'should initialize an output that has an initialize function': function (done) {
        var test = false;

        var ecoute = new Ecoute(mixin(basicConfig, {
            transformers: [mockTransformer({
                outputs: [mockOutput({
                    initialize: function (done) {
                        test = true;
                        done();
                    }
                })]
            })]
        }));

        ecoute.initializeOutputs(function () {
            assert.isTrue(test);
            done();
        });
    },

    'should be able to initialize multiple outputs': function (done) {
        var foo = false, bar = false, baz = false;

        var ecoute = new Ecoute(mixin(basicConfig, {
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

        ecoute.initializeOutputs(function () {
            assert.isTrue(foo);
            assert.isTrue(bar);
            assert.isTrue(baz);
            done();
        });
    },

    'should receive the output from a transformer': function (done) {
        var ecoute = new Ecoute({ transformers: [mockTransformer({
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

        ecoute.runTransformers(function(err) {
            refute.defined(err);
            done();
        });
    }
});