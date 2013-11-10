/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoule = require('../lib/ecoule'),
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

        ecoule.initializeSources(function () {
            ecoule.refreshSources(function () {
                assert.equals(ecoule.sources.foo.data, ['test']);
                done();
            });
        });
    },

    'should just pass through if no sources is given': function () {
        var ecoule = new Ecoule(mixin(basicConfig, {}));

        ecoule.initializeSources();

        assert.equals(Object.keys(ecoule.sources).length, 0);
    },

    'should have an object created in the ecoule source storage object': function () {
        var ecoule = new Ecoule(mixin(basicConfig, {
            sources: [mockSource({
                'title': 'Source Title'
            })]
        }));

        ecoule.initializeSources();

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
            ecoule.initializeSources,
            ecoule.refreshSources,
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
    }
});
