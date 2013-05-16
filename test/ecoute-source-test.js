/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoute = require('../lib/ecoute'),
    mixin = require('./helpers/mixin'),
    mockSource = require('./mocks/source'),
    serial = require('operandi').serial
;

var assert = buster.assertions.assert;
var refute = buster.assertions.refute;

var basicConfig = {};

buster.testCase('A source', {
    'should just pass through if no sources is given': function () {
        var ecoute = new Ecoute(mixin(basicConfig, {}));

        ecoute.initializeSources();

        assert.equals(Object.keys(ecoute.sources).length, 0);
    },

    'should have an object created in the ecoute source storage object': function () {
        var ecoute = new Ecoute(mixin(basicConfig, {
            sources: [mockSource({
                'title': 'Source Title'
            })]
        }));

        ecoute.initializeSources();

        assert.isObject(ecoute.sources['Source Title']);
    },

    'should be able to have multiple instances with different configurations': function (done) {
        var ecoute = new Ecoute(mixin(basicConfig, {
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

        serial.call(ecoute, [
            ecoute.initializeSources,
            ecoute.refreshSources,
            function (done) {
                assert.equals(ecoute.sources, {
                    'First Source': [ { title: 'A' }, { title: 'C' } ],
                    'Second Source': [ { title: 'B' }, { title: 'D' } ]
                });
                return done();
            }
        ], done);
    }
});
