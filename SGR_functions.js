var TERM_module = function () {
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
}

var TERM = TERM_module();

var classes_data = {
    bus: 'vehicle',
    light_rail: 'vehicle',
    street: 'infrastructure',
    track: 'infrastructure',
    building_utilities: 'systems/utilities',
    maintenance_building: 'building',
    overhead: 'infrastructure',
    parking: 'infrastructure',
    systems: 'systems/utilities',
    utility_building: 'building'
};

function class_of_asset(type) {
    var t = type.toLowerCase();
    while (t.indexOf(' ') >= 0)
        t = t.replace(' ', '_');
    return classes_data[t];
}

function projected_lifespan(type) {
    var f = function (years) { return TERM(type)(years) - 2.5; };
    var x2 = 1.;
    while (f(x2) >= 0) {
        x2 += 1
    }
    var x1 = x2 - 1,
        x3 = x2 - f(x2) * (x2 - x1) / (f(x2) - f(x1)),
        e = Math.abs(x3 - x2);
    while (e > 0.001) {
        x1 = x2;
        x2 = x3;
        x3 = x2 - f(x2) * (x2 - x1) / (f(x2) - f(x1));
        e = Math.abs(x3 - x2);
    }
    return Math.round(x3);
}

var SGR_module = function () {
    function in_good_repair(type, years) {
        return TERM(type)(years) >= 2.5;
    }
    function replacement_cost(type, years, init_cost) {
        return in_good_repair(type, years) ? 0 : init_cost * Math.pow(1.03, years);
    }
    function percent_original_investment(type, years, init_cost) {
        return replacement_cost(type, years, init_cost) / init_cost;
    }
    return {
        in_good_repair: in_good_repair,
        replacement_cost: replacement_cost,
        percent_original_investment: percent_original_investment
    };
};

var SGR = SGR_module();