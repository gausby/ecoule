/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoute = require('../lib/ecoute'),
    mixin = require('./helpers/mixin'),
    mockSource = require('./mocks/source'),
    mockDataHandler = require('./mocks/fileHandler'),
    serial = require('operandi').serial
;

var assert = buster.assertions.assert;
var refute = buster.assertions.refute;

var basicConfig = {};

buster.testCase('A data-handler', {
    'should run an initialize function if it has one': function (done) {
        var ran = false;
        var ecoute = new Ecoute(mixin(basicConfig, {
            'data-handlers': [
                mockDataHandler({
                    initialize: function(done) {
                        ran = true;
                        done();
                    }
                })
            ]
        }));

        ecoute.initializeDataHandlers(function (err) {
            assert.isTrue(ran);
            done();
        });
    },
    'should handle files': function (done) {
        var ecoute = new Ecoute(mixin(basicConfig, {
            sources: [
                mockSource({
                    'title': 'first',
                    'entries': [{'title': 'foo'}]
                })
            ],
            'data-handlers': [
                mockDataHandler({
                    match: function () {
                        return true;
                    },
                    execute: function (entry, done) {
                        entry.mock = entry.title.toUpperCase();
                        done();
                    }
                })
            ]
        }));

        serial.call(ecoute, [
            ecoute.initializeSources,
            ecoute.refreshSources,
            ecoute.runDataHandlers,
            function (done) {
                assert.equals(
                    ecoute.sources.first[0].mock,
                    'FOO'
                );
                return done();
            }
        ], done);
    },

    'should just pass through if no filehandlers has been specified': function (done) {
        var ecoute = new Ecoute(mixin(basicConfig, {
            sources: [
                mockSource({'title': 'first', 'entries': [{'title': 'foo'}]})
            ]
        }));

        serial.call(ecoute, [ecoute.initializeSources, ecoute.refreshSources], function() {
            refute.exception(function(){
                ecoute.runDataHandlers(function(){});
            });

            done();
        });
    }
});
