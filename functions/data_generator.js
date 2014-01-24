var asset_distribution = {
    bus: 70,
    light_rail: 40,
    street: 20,
    track: 15,
    building_utilities: 6,
    maintenance_building: 5,
    overhead: 7,
    parking: 20,
    systems: 30,
    utility_building: 5
};

var asset_volume = {
    bus: 1000,
    light_rail: 2000,
    street: 500,
    track: 1000,
    building_utilities: 5,
    maintenance_building: 5,
    overhead: 250,
    parking: 100,
    systems: 20,
    utility_building: 5
};

var price_range = {
    bus: [100000,500000],
    light_rail: [1000000,2000000],
    street: [10000,50000],
    track: [1000000,5000000],
    building_utilities: [10000,50000],
    maintenance_building: [800000,1200000],
    overhead: [100000,500000],
    parking: [20000,50000],
    systems: [5000,20000],
    utility_building: [500000,1000000]
};

var year_range = {
    bus: [1990,2010],
    light_rail: [1975,2005],
    street: [1990,2000],
    track: [1980,2005],
    building_utilities: [1950,1980],
    maintenance_building: [1940,1970],
    overhead: [1960,2000],
    parking: [1980,2000],
    systems: [1960,2000],
    utility_building: [1985,2005]
};

var total = 0;
for (var i in asset_distribution) {
    total += asset_distribution[i];
}
for (var i in asset_distribution) {
    asset_distribution[i] /= total;
}
total = 0;
for (var i in asset_distribution) {
    var min = total;
    var max = asset_distribution[i] + total;
    asset_distribution[i] = [min, max];
    total = max;
}

/*******************************
    SCHEMA:
    {
        serial: STRING (unique ID)
        type: STRING (type of asset)
        years: INTEGERS ARRAY (years of purchase/replacement)
        year: injected fetch function
        price: INTEGER
        volume: INTEGER (related to ridership)
    }
*******************************/
function generate_assets(n) {
    var csv = [];
    for (var i=0; i<n; i++) {
        var r = Math.random();
        for (var j in asset_distribution) {
            if (r >= asset_distribution[j][0] & r < asset_distribution[j][1]) {
                (function(){ // scoping issues
                    var years_array = [random_integer(year_range[j])];
                    csv.push({
                        serial: j.toUpperCase()+i,
                        type: j,
                        years: years_array,
                        year: function(y) {
                            var k = years_array.length-1;
                            while (years_array[k] >= y)
                                k--;
                            return years_array[k];
                        },
                        price: random_integer(price_range[j]),
                        volume: asset_volume[j]
                    });
                })();
            }
        }
    }
    return csv;
}

function generate_history(start, end, constrained) {
    var yearly_data = {};
    for (var year=start; year<=end; year++) {
        var good = 0.5+Math.random()*0.3;
        var marginal = (1-good)*Math.random()*0.5;
        var bad = (1-good-marginal)*Math.random();
        var backlog = (1-good-marginal-bad);
        yearly_data[year] = {
            good: good,
            marginal: marginal,
            bad: bad,
            backlog: backlog,
            investment: constrained ? yearly_budget*(1.5-good) : 80000000*(1.2-good)
        };
    }
    return yearly_data;
}

function random_integer(range) {
    return Math.round(Math.random()*(range[1]-range[0])+range[0]);
}