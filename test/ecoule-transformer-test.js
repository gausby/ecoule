/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoule = require('../lib/ecoule'),
    mixin = require('./helpers/mixin'),
    mockSource = require('./mocks/source'),
    mockTransformer = require('./mocks/transformer'),
    serial = require('operandi').serial
;

var assert = buster.referee.assert;
var refute = buster.referee.refute;

var basicConfig = {};

buster.testCase('A transformer', {
    'should not do anything if there is no transformers defined': function(done){
        var ecoule = new Ecoule(mixin(basicConfig));

        refute.exception(function() {
            ecoule.initializeTransformers(function () {
                done();
            });
        });
    },

    'should be initialized if it has an initialize function': function (done) {
        var ecoule = new Ecoule(mixin(basicConfig, {
            transformers: [mockTransformer({
                initialize: function (done) {
                    this.foo = 'bar';
                    return done();
                }
            })]
        }));

        serial.call(ecoule, [
            ecoule.initializeTransformers,
            function (done) {
                assert.equals(ecoule.transformers[0].foo, 'bar');
                return done();
            }
        ], done);
    },

    'should have its query compiled into a function if it has a query': function (done) {
        var ecoule = new Ecoule(mixin(basicConfig, {
            transformers: [mockTransformer({
                queries: {
                    mock: {
                        'foo': {equals: 'bar'}
                    }
                }
            })]
        }));

        serial.call(ecoule, [
            ecoule.initializeTransformers,
            function (done) {
                assert.isFunction(ecoule.transformers[0].queries.mock);
                // the query language is tested elsewhere
                assert.isTrue(ecoule.transformers[0].queries.mock({'foo': 'bar'}));
                refute.isTrue(ecoule.transformers[0].queries.mock({'foo': 'baz'}));

                return done();
            }
        ], done);
    },

    'should filter files based on a query language and only have those files given to its execute function': function (done) {
        var ecoule = new Ecoule(mixin(basicConfig, {
            sources: [
                mockSource({
                    'title': 'first',
                    'entries': [{'title': 'foo'}]
                }),
                mockSource({
                    'title': 'second',
                    'entries': [{'title': 'foo'}, {'title': 'bar'}, {'title': 'baz'}]
                })
            ],
            transformers: [mockTransformer({
                sources: ['second', 'first'],
                queries: {
                    mock: {'title': {equals: 'foo'}}
                },
                execute: function (done) {
                    // a 'files' key should be set
                    assert.defined(this.data);
                    assert.defined(this.data.mock);
                    // the given query should catch 2 files from the sources
                    assert.equals(this.data.mock.length, 2);

                    return done(null, []);
                }
            })]
        }));

        serial.call(ecoule, [
            ecoule.initializeSources,
            ecoule.refreshSources,
            ecoule.initializeTransformers,
            ecoule.runTransformers
        ], done);
    },

    'if no sources is specified it should query all the sources': function (done) {
        var ecoule = new Ecoule(mixin(basicConfig, {
            sources: [
                mockSource({
                    'title': 'first',
                    'entries': [{'title': 'foo'}]
                }),
                mockSource({
                    'title': 'second',
                    'entries': [{'title': 'foo'}, {'title': 'bar'}]
                })
            ],
            transformers: [mockTransformer({
                queries: {
                    mock: {'title': {equals: 'foo'}}
                },
                execute: function (done) {
                    // a 'files' key should be set
                    assert.defined(this.data);
                    assert.defined(this.data.mock);
                    // the given query should catch 2 files from the sources
                    assert.equals(this.data.mock.length, 2);

                    return done(null, []);
                }
            })]
        }));

        serial.call(ecoule, [
            ecoule.initializeSources,
            ecoule.refreshSources,
            ecoule.initializeTransformers,
            ecoule.runTransformers
        ], done);
    },

    'should be able to mutate the data in the sources': function (done) {
        var ecoule = new Ecoule(mixin(basicConfig, {
            sources: [
                mockSource({'title': 'first', 'entries': [{foo: 'baz'}]})
            ],
            transformers: [mockTransformer({
                queries: {
                    files: { foo: {equals: 'baz'}}
                },
                execute: function (done) {
                    this.data.files[0].foo = 'bar';
                    return done();
                }
            })]
        }));

        serial.call(ecoule, [
            ecoule.initializeSources,
            ecoule.refreshSources,
            ecoule.initializeTransformers,
            ecoule.runTransformers,
            function (done) {
                assert.defined(ecoule.sources.first[0].foo);
                assert.equals(ecoule.sources.first[0].foo, 'bar');

                return done();
            }
        ], done);
    },

    'should run preprocessors on transformers before running its execute function': function (done) {
        // assign a foo value on a transformer and alter that value with a
        // preprocessor and then the execute function
        var test = mockTransformer({
            execute: function (done) {
                this.foo += 'baz';
                return done(undefined, this.foo);
            },
            preprocessors: [function(done) {
                this.foo += this.foo;
                return done();
            }],
            outputs: [{
                execute: function (data, done) {
                    assert.equals(data, 'barbarbaz');
                    return done();
                }
            }]
        });

        test.foo = 'bar';
        var ecoule = new Ecoule(mixin(basicConfig, { transformers: [test] }));
        ecoule.runTransformers(done);
    },

    'should run postprocessors on the transformer output before giving it to the outputs': function (done) {
        // assign a foo value on a transformer and alter that value with a
        // preprocessor and then the execute function
        var test = mockTransformer({
            execute: function (done) {
                this.foo += 'baz';
                return done(undefined, this);
            },
            postprocessors: [function(done) {
                this.foo += 'bar';
                return done();
            }],
            outputs: [{
                execute: function (data, done) {
                    assert.equals(data.foo, 'barbazbar');
                    return done();
                }
            }]
        });

        test.foo = 'bar';
        var ecoule = new Ecoule(mixin(basicConfig, { transformers: [test] }));
        ecoule.runTransformers(done);
    }
});
