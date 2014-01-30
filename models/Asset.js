/**
 *  Stores an asset's data and exposes
 *  functions for its state of good repair.
 */
var Asset = function(values) {
    
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

    /*******************************
        LOAD DATA
    *******************************/
    
    var type = values.type.toLowerCase().replace(/[ ]+/,'_');
    var serial = values.serial.replace(/[ ]+/,'');
    var prices = values.prices;
    var years = values.years;
    for (var i in years) {
        years[i] = parseInt(years[i]);
        prices[i] = parseInt(prices[i]);
    }
    var usage = parseInt(values.usage);
    
    /*******************************
        DATA GETTERS/SETTERS
    *******************************/
    
    // to correctly fetch the asset's age
    // between replacement years
    function yearIndex(year) {
        var index = years.length-1;
        while (year - years[index] < 0)
            index--;
        return index;
    }
    
    /**
     *  Gets the asset's serial number.
     *  @return a string
     */
    this.serial = function () { return serial; };
    /**
     *  Gets the asset's type (bus, utility building, etc).
     *  @return a string
     */
    this.type = function () { return type; };
    /**
     *  Gets the asset's class (vehicle, infrastructure, etc).
     *  @return a string
     */
    this.class = function () { return asset_class[type]; };
    /**
     *  Gets the asset's usage metric.
     *  @return a number
     */
    this.usage = function () { return usage; };
    /**
     *  Gets the asset's age at the specified year.
     *  @param year a number
     *  @return a number
     */
    this.age = function (year) {
        return year - years[yearIndex(year)];
    };
    /**
     *  Gets the asset's price at the specified year.
     *  Adjusted for .03 annual interest.
     *  @param year a number
     *  @return a number
     */
    this.price = function (year) {
        return prices[yearIndex(year)] * Math.pow(1.03, this.age(year));
    };
    /**
     *  Gets the actual amount invested in the asset
     *  during the given year.
     *  @param year a number
     *  @return a number
     */
    this.amount_invested = function (year) {
        var i = years.indexOf(year);
        return i < 0 ? 0 : prices[i];
    };
    /**
     *  Replaces the asset during the given year
     *  at the given cost.
     *  @param year a number
     *  @param cost a number
     */
    this.replace = function (year, cost) {
        prices.push(cost || this.price(year));
        years.push(year);
    };
    
    /*******************************
        GOOD REPAIR FUNCTIONS
    *******************************/
    
    /**
     *  Gets the asset's TERM condition rating
     *  at the specified year.
     *  @param year a number
     *  @return a number in [1,5]
     */
    this.condition = function (year) {
        return Math.max(1, Math.min(5, TERM(type)(this.age(year))));
    };
    /**
     *  Returns true if the asset's TERM condition
     *  rating is 2.5 or above at the given year.
     *  @param year a number
     *  @return a boolean
     */
    this.in_good_repair = function (year) {
        return this.condition(year) >= 2.5;
    };
    /**
     *  Gets the asset's cost of replacement
     *  at the specified year. Returns 0 if the
     *  asset does not need to be replaced that year.
     *  @param year a number
     *  @return a number
     */
    this.replacement_cost = function (year) {
        return this.in_good_repair(year) ? 0 : this.price(year);
    };
    /**
     *  Gets the asset's cost of replacement
     *  at the specified year as a fraction of its
     *  original cost of purchase.
     *  @param year a number
     *  @return a number in [0,1]
     */
    this.percent_original_investment = function (year) {
        return this.replacement_cost(year) / price;
    };
    /**
     *  Gets the asset's projected lifespan in years.
     *  @return a number
     */
    this.projected_lifespan = function () {
        // secant method
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
    /**
     *  Gets the year that the asset needs to be replaced.
     *  @param year a number
     *  @return a number
     */
    this.replacement_year = function (year) {
        return year + this.projected_lifespan() - this.age(year);
    };
    /**
     *  Gets the decay rate of the asset's TERM condition
     *  rating (dc/dt) at the given year.
     *  @param year a number
     *  @return a number
     */
    this.decay_rate = function (year) {
        return this.condition(year) - this.condition(year+1);
    };
}