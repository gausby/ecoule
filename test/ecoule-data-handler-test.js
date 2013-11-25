/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoule = require('../lib/ecoule'),
    datahandlers = require('../lib/datahandlers'),
    sources = require('../lib/sources'),
    mixin = require('./helpers/mixin'),
    mockSource = require('./mocks/source'),
    mockDataHandler = require('./mocks/data-handler'),
    serial = require('operandi').serial
;

var assert = buster.referee.assert;
var refute = buster.referee.refute;

var basicConfig = {};

buster.testCase('A data-handler', {
    'should run an initialize function if it has one': function (done) {
        var ran = false;
        var ecoule = new Ecoule(mixin(basicConfig, {
            'data-handlers': [
                mockDataHandler({
                    initialize: function(done) {
                        ran = true;
                        done();
                    }
                })
            ]
        }));

        datahandlers.initializeDataHandlers.call(ecoule, function (err) {
            assert.isTrue(ran);
            done();
        });
    },

    'should handle matched files': function (done) {
        var ecoule = new Ecoule(mixin(basicConfig, {
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

        serial.call(ecoule, [
            sources.initializeSources,
            sources.refreshSources,
            datahandlers.runDataHandlers,
            function (done) {
                assert.equals(
                    ecoule.sources.first.data[0].mock,
                    'FOO'
                );
                return done();
            }
        ], done);
    },

    'should just pass through if no filehandlers has been specified': function (done) {
        var ecoule = new Ecoule(mixin(basicConfig, {
            sources: [
                mockSource({'title': 'first', 'entries': [{'title': 'foo'}]})
            ]
        }));

        serial.call(ecoule, [sources.initializeSources, sources.refreshSources], function() {
            refute.exception(function(){
                datahandlers.runDataHandlers.call(ecoule, function(){});
            });

            done();
        });
    },

    'should compile a match function using Pursuit if an object is passed as the match function': function (done) {
        var ecoule = new Ecoule(mixin(basicConfig, {
            'data-handlers': [
                mockDataHandler({
                    match: { foo: {equals: 'bar'}}
                })
            ]
        }));

        serial.call(ecoule, [datahandlers.initializeDataHandlers], function() {
            assert.isFunction(ecoule.dataHandlers[0].match);
            assert.isTrue(ecoule.dataHandlers[0].match({ foo: 'bar' }));
            refute.isTrue(ecoule.dataHandlers[0].match({ foo: 'baz' }));

            done();
        });
    }
});
