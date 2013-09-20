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
                    'title': 'First Source',
                    'entries': [{'title': 'A'}, {'title': 'C'}]
                }),
                mockSource({
                    'title': 'Second Source',
                    'entries': [{'title': 'B'}, {'title': 'D'}]
                })
            ]
        }));

        serial.call(ecoule, [
            ecoule.initializeSources,
            ecoule.refreshSources,
            function (done) {
                assert.equals(ecoule.sources, {
                    'First Source': [ { title: 'A' }, { title: 'C' } ],
                    'Second Source': [ { title: 'B' }, { title: 'D' } ]
                });
                return done();
            }
        ], done);
    }
});
