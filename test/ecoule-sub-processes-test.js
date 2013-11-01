/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoule = require('../lib/ecoule'),
    serial = require('operandi').serial,

    mockTransformer = require('ecoule-transformer-mock')
;

var assert = buster.referee.assert;
var refute = buster.referee.refute;

var mockDataHandler = require('./mocks/data-handler');
var mockSource = require('./mocks/source');

buster.testCase('Ecoule sub-processes', {
    'sources': {
        'should be able to initialize': function (done) {
            var ecoule = new Ecoule({
                transformers: [(mockTransformer({
                    helpers: {
                        'foo': (new Ecoule({
                            sources: [mockSource({
                                initialize: function (done) {
                                    this.foo = 'bar';
                                    done();
                                }
                            })],
                            transformers: [ mockTransformer() ]
                        }))
                    }
                }))]
            });

            ecoule.initializeTransformers(function (err) {
                refute.defined(err);
                assert.equals(ecoule.transformers[0].helpers.foo.config.sources[0].foo, 'bar');
                done();
            });
        },

        'should be able to refresh when the parent ecoule is refreshing sources': function (done) {
            var ecoule = new Ecoule({
                transformers: [(mockTransformer({
                    helpers: {
                        'foo': (new Ecoule({
                            sources: [mockSource({
                                refresh: function (done) {
                                    done(undefined, true);
                                }
                            })],
                            transformers:[ mockTransformer() ]
                        }))
                    }
                }))]
            });

            var cb = function (err) {
                refute.defined(err);
                assert.equals(ecoule.transformers[0].helpers.foo.sources, {'Mock source': true});
                done();
            };

            serial.call(ecoule, [
                ecoule.initializeTransformers,
                ecoule.refreshSources
            ], cb);
        }
    },

    'data-handlers': {
        'Should be able to initialize': function (done) {
            var ecoule = new Ecoule({
                transformers: [(mockTransformer({
                    helpers: {
                        'foo': (new Ecoule({
                            transformers:[ mockTransformer() ],
                            'data-handlers': [mockDataHandler({
                                initialize: function (done) {
                                    this.foo = 'bar';
                                    done();
                                }
                            })]
                        }))
                    }
                }))]
            });

            ecoule.initializeTransformers(function (err) {
                refute.defined(err);
                assert.equals(ecoule.transformers[0].helpers.foo.dataHandlers[0].foo, 'bar');
                done();
            });
        },

        'Should execute along the other data handlers': function (done) {
            var ecoule = new Ecoule({
                transformers: [(mockTransformer({
                    helpers: {
                        'foo': (new Ecoule({
                            transformers:[ mockTransformer() ],
                            sources: [mockSource({ refresh: function (done) {
                                return done(undefined, [{ foo: 'bar'}]);
                            }})],
                            'data-handlers': [mockDataHandler({
                                execute: function (entry, done) {
                                    entry.foo = entry.foo.toUpperCase();
                                    done();
                                }
                            })]
                        }))
                    }
                }))]
            });

            var cb = function (err) {
                refute.defined(err);
                assert.equals(
                    ecoule.transformers[0].helpers.foo.sources['Mock source'],
                    [{foo: 'BAR'}]
                );
                done();
            };

            serial.call(ecoule, [
                ecoule.initializeTransformers,
                ecoule.refreshSources,
                ecoule.runDataHandlers
            ], cb);
        }
    },

    'transformers': {
        'should be able to  initialize': function (done) {
            var ecoule = new Ecoule({
                transformers: [(mockTransformer({
                    helpers: {
                        'foo': (new Ecoule({
                            transformers:[ mockTransformer({
                                initialize: function (done) {
                                    this.foo = 'bar';
                                    done();
                                }
                            }) ]
                        }))
                    }
                }))]
            });

            ecoule.initializeTransformers(function(err) {
                refute.defined(err);
                assert.equals(ecoule.transformers[0].helpers.foo.transformers[0].foo, 'bar');
                done();
            });
        },

        'should be able to execute and output its output to a defined key': function (done) {
            var ecoule = new Ecoule({
                transformers: [(mockTransformer({
                    helpers: {
                        'foo': (new Ecoule({
                            transformers:[ mockTransformer({
                                execute: function (done) {
                                    done(undefined, {'bar': 'baz'});
                                }
                            }) ]
                        }))
                    },
                    execute: function (done) {
                        done();
                    }
                }))]
            });

            var cb = function(err) {
                refute.defined(err);
                assert.equals(ecoule.transformers[0].foo, { bar: 'baz' });
                done();
            };

            serial.call(ecoule, [
                ecoule.initializeTransformers,
                ecoule.runTransformers
            ], cb);
        }
    }
});
