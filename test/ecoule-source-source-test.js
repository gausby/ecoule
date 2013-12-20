/*jslint maxlen:140*/
/* global require */
'use strict';

var buster = require('buster'),
    Ecoule = require('../lib/ecoule'),
    sources = require('../lib/ecoule-sources')
;

var assert = buster.referee.assert;
var refute = buster.referee.refute;

var basicConfig = {};

buster.testCase('A source helper', {
    'should initialize before the source is executed': function (done) {
        assert.isTrue(true);
        done();
    }
});
