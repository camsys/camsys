var asset_class = {
    bus: 'vehicle',
    light_rail: 'vehicle',
    street: 'infrastructure',
    track: 'infrastructure',
    building_utilities: 'infrastructure',
    maintenance_building: 'infrastructure',
    overhead: 'infrastructure',
    parking: 'infrastructure',
    systems: 'infrastructure',
    utility_building: 'infrastructure'
};

var Asset = function(values) {
    /*******************************
        INTERNAL DATA
    *******************************/
    
    var type = values.type.toLowerCase().replace(/[ ]+/,'_');
    var serial = values.serial.replace(/[ ]+/,'');
    var price = parseInt(values.price);
    var years = values.years;
    for (var i in years)
        years[i] = parseInt(years[i]);
    var usage = parseInt(values.usage);
    
    /*******************************
        DATA FETCHERS
    *******************************/
    
    this.serial = function () { return serial; };
    this.type = function () { return type; };
    this.usage = function () { return usage; };
    this.replace = function (year, cost) { years.push(year); price = cost || price; };
    this.age = function (year) {
        var index = years.length-1;
        while (year - years[index] < 0)
            index--;
        return year - years[index];
    };
    this.price = function (year) {
        return price * Math.pow(1.03, this.age(year));
    };
    this.class = function () { return asset_class[type]; };
    
    /*******************************
        GOOD REPAIR FUNCTIONS
    *******************************/
    
    this.in_good_repair = function (year) {
        return TERM(type)(this.age(year)) >= 2.5;
    };
    this.replacement_cost = function (year) {
        return this.in_good_repair(year) ? 0 : this.price(year);
    };
    this.percent_original_investment = function (year) {
        return this.replacement_cost(year) / price;
    };
    this.projected_lifespan = function () {
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
    };
    this.replacement_year = function (year) {
        return year + this.projected_lifespan() - this.age(year);
    };
}