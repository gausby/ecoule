/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoule = require('../lib/ecoule'),
    sources = require('../lib/ecoule-sources'),
    mixin = require('./helpers/mixin'),
    mockSource = require('./mocks/source'),
    serial = require('operandi').serial
;

var assert = buster.referee.assert;
var refute = buster.referee.refute;

var basicConfig = {};

buster.testCase('A source', {
    'should be able to refresh': function (done) {
        var ecoule = new Ecoule({
            sources: [mockSource({
                title: 'foo',
                refresh: function (done) {
                    done(undefined, ['test']);
                }
            })]
        });

        sources.initializeAll.call(ecoule, function () {
            sources.refreshAll.call(ecoule, function () {
                assert.equals(ecoule.sources.foo.data, ['test']);
                done();
            });
        });
    },

    'should just pass through if no sources is given': function () {
        var ecoule = new Ecoule(mixin(basicConfig, {}));

        sources.initializeAll.call(ecoule);

        assert.equals(Object.keys(ecoule.sources).length, 0);
    },

    'should have an object created in the ecoule source storage object': function () {
        var ecoule = new Ecoule(mixin(basicConfig, {
            sources: [mockSource({
                'title': 'Source Title'
            })]
        }));

        sources.initializeAll.call(ecoule);

        assert.isObject(ecoule.sources['Source Title']);
    },

    'should be able to have multiple instances with different configurations': function (done) {
        var ecoule = new Ecoule(mixin(basicConfig, {
            sources: [
                mockSource({
                    'title': 'first',
                    'entries': [{'title': 'A'}, {'title': 'C'}]
                }),
                mockSource({
                    'title': 'second',
                    'entries': [{'title': 'B'}, {'title': 'D'}]
                })
            ]
        }));

        serial.call(ecoule, [
            sources.initializeAll,
            sources.refreshAll,
            function (done) {
                assert.equals(
                    ecoule.sources.first.data,
                    [ { title: 'A' }, { title: 'C' } ]
                );

                assert.equals(
                    ecoule.sources.second.data,
                    [ { title: 'B' }, { title: 'D' } ]
                );

                return done();
            }
        ], done);
    },

    'should run an optional before-function before running refresh': function (done) {
        var spy = this.spy();

        sources.refresh(mockSource({ before: function(done) { spy(); done(); }}), function () {
            assert.calledOnce(spy);
            done();
        });
    },

    'should run an optional after-function after running refresh': function (done) {
        var spy = this.spy();

        sources.refresh(mockSource({ after: function(done) { spy(); done(); }}), function () {
            assert.calledOnce(spy);
            done();
        });
    },

    'with helpers': {
        'should initialize its helpers': function (done) {
            var spy = this.spy();
            var mock = { sources: {} };

            var source = mockSource({
                helpers: [
                    mockSource({
                        initialize: function(done) {
                            spy();
                            done();
                        }
                    })
                ]
            });

            sources.initialize.call(mock, source, function () {
                assert.calledOnce(spy);
                done();
            });
        },

        'should make the helpers output available to its parent': function (done) {
            var mock = { sources: {} };

            var source = mockSource({
                helpers: [
                    mockSource({ title: 'child', entries: [{foo: 'bar'}] })
                ],
                refresh: function (done) {
                    assert.equals(this.sources.child.data, [{foo: 'bar'}]);
                    done();
                }
            });

            sources.initialize.call(mock, source, function () {
                sources.refresh.call(mock, source, done);
            });
        },

        'should pass initialization errors to the main process': function (done) {
            var mock = { sources: {} };

            var source = mockSource({
                helpers: [
                    mockSource({
                        initialize: function(done) {
                            done(new Error('foo'));
                        }
                    })
                ]
            });

            sources.initialize.call(mock, source, function (err) {
                assert.isTrue(err instanceof Error);
                done();
            });
        },

        'should throw refresh errors to the main process': function (done) {
            var mock = { sources: {} };

            var source = mockSource({
                helpers: [
                    mockSource({
                        refresh: function(done) {
                            done(new Error('ouch!'));
                        }
                    })
                ]
            });

            sources.initialize.call(mock, source, function () {
                sources.refresh.call(mock, source, function (err) {
                    assert.isTrue(err instanceof Error);
                    done();
                });
            });
        },

        'should throw an error if the key sources is already set': function (done) {
            var mock = { sources: {} };

            var source = mockSource({
                initialize: function (done) {
                    this.sources = 'test';
                    done();
                },
                helpers: [mockSource()]
            });

            sources.initialize.call(mock, source, function (err) {
                assert.isTrue(err instanceof Error);
                done();
            });
        }
    }
});
