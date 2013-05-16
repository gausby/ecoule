'use strict';

module.exports = function () {

    var rtn = {},
        i = 0,
        argument
    ;

    for (;arguments[i]; i += 1) {
        for (argument in arguments[i]) {
            if (arguments[i].hasOwnProperty(argument)) {
                rtn[argument] = arguments[i][argument];
            }
        }
    }

    return rtn;
};
