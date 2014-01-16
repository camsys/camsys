/**
generates:
- VEHICLES
- BUILDINGS
- INFRASTRUCTURE
- SYSTEMS/UTILITIES
**/

var distributions = {
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

var total = 0;
for (var i in distributions) {
    total += distributions[i];
}
for (var i in distributions) {
    distributions[i] /= total;
}
total = 0;
for (var i in distributions) {
    var min = total;
    var max = distributions[i] + total;
    distributions[i] = [min, max];
    total = max;
}

function generate_assets(n) {
    var csv = [];
    for (var i=0; i<n; i++) {
        var r = Math.random();
        for (var j in distributions) {
            if (r >= distributions[j][0] & r < distributions[j][1])
                csv.push({
                    'Complet Vehicle ID # (Serial No.)': j.toUpperCase()+i,
                    Type: j,
                    Year: random_integer(1970, 2013),
                    'purchase price': random_integer(100000,10000000)
                });
        }
    }
    return csv;
}

function generate_history(start, end) {
    var yearly_data = {};
    for (var year=start; year<=end; year++) {
        var good = 0.7+Math.random()*0.2;
        var marginal = (1-good)*Math.random();
        var bad = (1-good-marginal)*Math.random();
        var backlog = (1-good-marginal-bad);
        yearly_data[year] = {
            good: good,
            marginal: marginal,
            bad: bad,
            backlog: backlog,
            investment: 500000000*good
        };
    }
    return yearly_data;
}

function random_integer(min, max) {
    return Math.round(Math.random()*(max-min)+min);
}