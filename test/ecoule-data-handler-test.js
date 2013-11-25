/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoule = require('../lib/ecoule'),
    datahandlers = require('../lib/ecoule-data-handlers'),
    sources = require('../lib/ecoule-sources'),
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

        datahandlers.initialize.call(ecoule, function (err) {
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
            sources.initialize,
            sources.refreshAll,
            datahandlers.execute,
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

        serial.call(ecoule, [sources.initialize, sources.refreshAll], function() {
            refute.exception(function(){
                datahandlers.execute.call(ecoule, function(){});
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

        serial.call(ecoule, [datahandlers.initialize], function() {
            assert.isFunction(ecoule.dataHandlers[0].match);
            assert.isTrue(ecoule.dataHandlers[0].match({ foo: 'bar' }));
            refute.isTrue(ecoule.dataHandlers[0].match({ foo: 'baz' }));

            done();
        });
    }
});
