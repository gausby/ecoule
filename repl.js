/* global require module process */
'use strict';

var repl = require('repl'),
    Ecoute = require('./lib/ecoute')
;

var local = repl.start('> ');
local.context.Ecoute = Ecoute;
