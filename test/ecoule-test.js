/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoule = require('../lib/ecoule'),
    mixin = require('./helpers/mixin')
;

var assert = buster.referee.assert;
var refute = buster.referee.refute;

buster.testCase('Ecoule Engine', {
    /* This test should pass but has been deferred. Feel free to toy
     * around with the framework by replacing the '//' with a pop-rocket
     * '=>' and change the values, functionality, etc. */
    '// integration test: watership down edition': function (done) {
        /* source =================================================== */
        function Source (config) {
            this.title = config.title || 'Untitled source';
            this.data = config.data || [];
        }

        Source.prototype.refresh = function(done) {
            var err; // undefined, no errors

            return done(err, this.data);
        };


        /* data-handler ============================================= */
        function DataHandler (config) {
            this.match = config.match || {};
        }

        DataHandler.prototype.execute = function(entry, done) {
            var err; // undefined, no errors

            entry.name = entry.name.toUpperCase();

            return done(err);
        };


        /* transformer ============================================== */
        function Transformer (config) {
            config = config || {};
            this.queries = config.queries || {};
            this.preprocessors = config.preprocessors || [];
            this.postprocessors = config.postprocessors || [];
            this.outputs = config.outputs || [];
        }

        Transformer.prototype.execute = function (done) {
            var err; // undefined, no errors

            // just pass the data from the queries along, untouched
            return done(err, this.data);
        };


        /* output =================================================== */
        function Output (config) {
            config = config || {};
        }

        Output.prototype.execute = function (output, done) {
            var err; // undefined, no errors

            assert.equals(output, {
                owsla: [{ name: "BIGWIG" }],
                rabbits: [{ name: "FIVER" }, { name: "BIGWIG" }]
            });

            done(err);
        };


        // Put it all together and try to execute it
        var instance = new Ecoule({
            'sources': [
                new Source({
                    title: 'warren',
                    data: [{ name: 'fiver' }, { name: 'bigwig' }]
                })
            ],
            'data-handlers': [
                new DataHandler({
                    match: {
                        name: { typeOf: 'string' }
                    }
                })
            ],
            'transformers': [
                new Transformer ({
                    queries: {
                        owsla: { name: { equals: 'BIGWIG' }},
                        rabbits: { name: { typeOf: 'string' }}
                    },
                    outputs: [
                        new Output({})
                    ]
                })
            ]
        });

        instance.refresh(function(err) {
            // this setup should not return errors
            refute.isObject(err);
            done();
        });
    }
});
