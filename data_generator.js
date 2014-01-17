/**
generates:
- VEHICLES
- BUILDINGS
- INFRASTRUCTURE
- SYSTEMS/UTILITIES
**/

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

var asset_volume = { // volume of people transported per day
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

function generate_assets(n) {
    var csv = [];
    for (var i=0; i<n; i++) {
        var r = Math.random();
        for (var j in asset_distribution) {
            if (r >= asset_distribution[j][0] & r < asset_distribution[j][1])
                csv.push({
                    'Complet Vehicle ID # (Serial No.)': j.toUpperCase()+i,
                    Type: j,
                    Year: random_integer([1970, 2013]),
                    'purchase price': random_integer(price_range[j]),
                    volume: asset_volume[j]
                });
        }
    }
    return csv;
}

function generate_history(start, end) {
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
            investment: 80000000*good
        };
    }
    return yearly_data;
}

function random_integer(range) {
    return Math.round(Math.random()*(range[1]-range[0])+range[0]);
}