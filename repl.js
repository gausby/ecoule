/* global require module process */
'use strict';

var repl = require('repl'),
    Ecoule = require('./lib/ecoule')
;

var local = repl.start('> ');
local.context.Ecoule = Ecoule;
