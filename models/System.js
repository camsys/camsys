/**
 *  Stores data for an array of assets as a system.
 *  Exposes functions for system-wide state of good repair
 *  and data re-formatting.
 */
var System = function (csv) {
    
    // transform raw CSV data into Asset objects
    var original_assets = [];
    for (var i in csv) {
        original_assets.push(new Asset(Util.clone(csv[i])));
    }
        
    // runs a given function over multiple years
    function per_year(func, years, options) {
        if (years[0] === undefined)
            return func(years, options);
        else {
            var per_year_data = {};
            for (var i in years) {
                var year = years[i];
                per_year_data[year] = func(year, options);
            }
            return per_year_data;
        }
    }
    
    /*****************************
        DATA RE-FORMATTERS
    *****************************/
    
    this.format = {
        
        /**
         *  Formats the data into the 'flare.json' format commonly
         *  used in D3 examples. In particular, to make it play nice
         *  with d3.partition.nodes() for the sunburst graph.
         *  @param metric the size function for each asset,
         *      as a function of a single Asset object
         *  @return a 'flare.json' data object representing this System
         */
        flare: function (metric) {
            
            // define root
            var json_data = {
                name: "total",
                children: []
            };
            
            for (var i in original_assets) {
                var asset = original_assets[i];
                var size = metric(asset);
                var name = asset.serial();
                var type = asset.type();
                var clas = asset.class();
                
                // add the class if not found
                var class_index = json_data.children.length;
                for (var j in json_data.children) {
                    if (json_data.children[j].name === clas)
                        class_index = j;
                }
                if (class_index === json_data.children.length)
                    json_data.children.push({
                        name: clas,
                        children: []
                    });
                
                // add the type if not found
                var type_index = json_data.children[class_index].children.length;
                for (var j in json_data.children[class_index].children) {
                    if (json_data.children[class_index].children[j].name === type)
                        type_index = j;
                }
                if (type_index === json_data.children[class_index].children.length)
                    json_data.children[class_index].children.push({
                        name: type,
                        children: []
                    });
                
                // add the asset
                json_data.children[class_index].children[type_index].children.push({
                    name: name,
                    size: size
                });
            }
            
            // format the name field
            for (var i in json_data.children) {
                for (var j in json_data.children[i].children) {
                    name = json_data.children[i].children[j].name.toLowerCase();
                    while (name.indexOf(' ') >= 0)
                        name = name.replace(' ', '_');
                    json_data.children[i].children[j].name = name;
                }
            }
            
            return json_data;
        }
    };
    
    /*****************************
        SYSTEM METRICS
    *****************************/
    
    /**
     *  Calculates the percentages of good, marginal, bad
     *  and backlog assets during the given year, as well
     *  as the investment during that year.
     *  Also stores the percentage data for each sub-class
     *  and sub-type of asset in the 'children' field.
     *  OPTIONS: {
     *      budget: A NUMBER representing annual budget,
     *      metric: A FUNCTION (Asset object, year number)
     *          determines the weight of each asset,
     *      comparator: A FUNCTION (Asset object, Asset object, year)
     *          determines the priority queue order of the assets
     *          (last index popped first),
     *      assets: AN ARRAY of assets to calculate with
     *  }
     *  @param year a number
     *  @param options an optional object as described above
     *  @return an object with percentage and investment data
     */
    function GMBB(year, options) {
        var budget = options.budget || Infinity;
        var constrained = budget < Infinity;
        var metric = options.metric || 1;
        var comparator = options.comparator || function () { return 0; };
        var assets = options.assets || original_assets;
        
        var template = {
            good: 0,
            marginal: 0,
            bad: 0,
            backlog: 0,
            investment: 0
        };
        
        var gmbb = Util.clone(template, {children:{}});
        
        var bad_queue = [];
        var backlog_queue = [];
        var marginal_queue = [];
        function compare(a, b) {
            return comparator(a, b, year);
        }
        
        
        for (var i in assets) {
            var asset = assets[i];
            
            var serial = asset.serial();
            var type = asset.type();
            var clas = asset.class();
            
            if (gmbb.children[clas] === undefined)
                gmbb.children[clas] = Util.clone(template, {children:{}});
            if (gmbb.children[clas].children[type] === undefined)
                gmbb.children[clas].children[type] = Util.clone(template, {children:{}});
            gmbb.children[clas].children[type].children[serial] = Util.clone(template);
            
            // determine state of repair by proximity to replacement year
            
            var replacement_year = asset.replacement_year(year);
            var condition;
            
            if (replacement_year === year) {
                condition= 'bad';
                bad_queue.push(asset);
            }
            else if (replacement_year < year) {
                condition= 'backlog';
                backlog_queue.push(asset);
            }
            else if (replacement_year === year + 1) {
                condition= 'marginal';
                marginal_queue.push(asset);
            }
            else
                condition= 'good';
            
            var measure = metric(asset, year);
            
            gmbb[condition] += measure;
            gmbb.children[clas][condition] += measure;
            gmbb.children[clas].children[type][condition] += measure;
            gmbb.children[clas].children[type].children[serial][condition] += measure;
        }
        
        // normalize to [0,1]
        
        function normalize(node) {
            var total = node.good + node.bad + node.marginal + node.backlog;
            node.good /= total; node.bad /= total; node.marginal /= total; node.backlog /= total;
            for (var child in node.children)
                normalize(node.children[child]);
        }
        normalize(gmbb);
        
        // clear as much investment as possible
        // using bad-marginal-backlog queue order
        
        bad_queue.sort(compare);
        backlog_queue.sort(compare);
        marginal_queue.sort(compare);
        var queue = constrained
            ? backlog_queue.concat(marginal_queue.concat(bad_queue))
            : backlog_queue;
        
        while (budget > 0 && queue.length > 0) {
            var i = queue.length-1;
            while (i >= 0 && queue[i].price(year) > budget)
                i--; // skip over investments greater than available budget
            if (i < 0) break; // all possible investments made\
            
            // replace asset
            var asset = queue.splice(i,1)[0];
            var serial = asset.serial();
            var type = asset.type();
            var clas = asset.class();
            var cost = asset.price(year);
            asset.replace(year);
            budget -= cost;
            gmbb.investment += cost;
            gmbb.children[clas].investment += cost;
            gmbb.children[clas].children[type].investment += cost;
            gmbb.children[clas].children[type].children[serial].investment += cost;
        }
        
        return gmbb;
    }
    
    this.system_metric = {
        gmbb: function (years, options) {
            return per_year(GMBB, years, options);
        }
    };
    
    /*****************************
        OPTIMIZATION FUNCTIONS
    *****************************/
    
    /**
     *  Calculates the flat annual budget required
     *  to clear the backlog by the given year.
     *  @param year a number
     *  @return a number
     */
    this.budget_to_clear_by = function (year) {
        var fresh_assets = [];
        for (var i in csv) {
            fresh_assets.push(new Asset(Util.clone(csv[i])));
        }
        
        // starting bounds: no budget and budget needed to clear this year
        var highGuess = GMBB(currentYear, {assets: fresh_assets,
                                           metric: area_bar_metric,
                                           comparator: area_bar_comparator}).investment;
        var lowGuess = 0;
        var middleGuess, middleYear;
        var e = 1000;
        
        if (year === currentYear)
            return highGuess;
        
        // binary search between the bounds for the lowest
        // budget that can clear the backlog in time
        while (e > 1 || middleYear > year) {
            middleGuess = (lowGuess+highGuess)/2;
            middleYear = this.year_to_clear_with(middleGuess);
            if (middleYear > year)
                lowGuess = middleGuess;
            else
                highGuess = middleGuess;
            e = highGuess - lowGuess;
        }
        
        return Math.ceil(middleGuess);
    };
    
    /**
     *  Calculates the year the backlog will be cleared by
     *  given the specified annual budget.
     *  @param budget a number
     *  @return a number
     */
    this.year_to_clear_with = function (budget) {
        // run GMBB with budget through each year
        // starting from the current year
        // find first year with backlog = 0
        var fresh_assets = [];
        for (var i in csv) {
            fresh_assets.push(new Asset(Util.clone(csv[i])));
        }
        var year = currentYear;
        while (GMBB(year, {budget: budget,
                           assets: fresh_assets,
                           metric: area_bar_metric,
                           comparator: area_bar_comparator}).backlog > 0 && year < currentYear+100)
            year++;
        return year === currentYear+100 ? Infinity : year;
    };
}