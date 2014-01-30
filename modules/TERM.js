/**
 *  Exposes functions to calculate the TERM
 *  condition rating of each type of asset.
 */
var TERM = (function () {
    function scaled_sigmoid(number) {
        return Math.exp(number) / (1 + Math.exp(number)) * 4 + 1;
    }
    var functions = {
        bus: function (years) {
            if (years <= 3)
                return -1.75/3 * years + 5 + 1.75/3;
            else
                return 3.29886 * Math.exp(-0.0178422 * years);
        },
        light_rail: function (years) {
            if (years <= 2.5)
                return -3.75/5 * years + 5 + 3.75/5;
            else
                return 4.54794 * Math.exp(-0.0204658 * years);
        },
        street: function (years) {
            return scaled_sigmoid(6.57 - 0.363 * years);
        },
        track: function (years) {
            return 4.94961 * Math.exp(-0.0162812 * years);
        },
        building_utilities: function (years) {
            return scaled_sigmoid(3.926 - 0.096 * years);
        },
        maintenance_building: function (years) {
            if (years <= 18.5)
                return 5.08593 * Math.exp(-0.0196381 * years);
            else if (years <= 19)
                return -2.08 / 5 * years + 11.236;
            else
                return 3.48719 * Math.exp(-0.0042457 * years);
        },
        overhead: function (years) {
            return scaled_sigmoid(6.486 - 0.162 * years);
        },
        parking: function (years) {
            return scaled_sigmoid(6.689 - 0.255 * years);
        },
        systems: function (years) {
            return 4.86483 * Math.exp(-0.0137402 * years);
        },
        utility_building: function (years) {
            if (years <= 18.5)
                return 5.16968 * Math.exp(-0.0333174 * years);
            else if (years <= 19)
                return -7.5 * 0.25 / 5 * years + 9.75;
            else
                return 3.14481 * Math.exp(-0.0116421 * years);
        }
    };
    return function (type) {
        if (type === 'functions')
            return functions;
        var t = type.toLowerCase();
        while (t.indexOf(' ') >= 0)
            t = t.replace(' ', '_');
        return functions[t];
    }
})();