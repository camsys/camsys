var load_data = function (csv) {
    
    /*****************************
        APPLY NECESSARY
        DATA TRANSFORMATIONS
    *****************************/
    
    // inject year fetcher function
    for (var i in csv) {
        (function() {
            var years_array = csv[i].years;
            csv[i].year = function(y) {
                var k = years_array.length-1;
                while (years_array[k] >= y)
                    k--;
                return years_array[k];
            };
        })();
    }
    
    /*****************************
        DATA RE-FORMATTERS
    *****************************/
    
    // format data into the 'flare.json' format
    // found on many D3 examples
    var format = {
        flare: function (metric, trim) {
            var json_data = {
                name: "total",
                children: []
            };
            for (var i in csv) {
                var asset = csv[i];
                var size = metric(asset);
                var name = asset.serial;
                var type = asset.type;
                var clas = class_of_asset(type);
                if (!trim | size > 0) {
                    // add the class
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
                    // add the type
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
                    json_data.children[class_index].children[type_index].children.push({
                        name: name,
                        size: size
                    });
                }
            }
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
    
    // calculates the good/marginal/bad/backlog
    // percentages per year
    function GMBB(year, options) {
        var constrained = options.constrained;
        
        var investment= 0;
        var bad_queue = [];
        var backlog_queue = [];
        var marginal_queue = [];
        function compare(a,b) {
            return a[1] < b[1] ? 1 :
                a[1] > b[1] ? -1 : 0;
        }
        
        var gmbb = {
            good: 0.,
            marginal: 0.,
            bad: 0.,
            backlog: 0.
        };
        
        for (var i in csv) {
            var asset = csv[i];
            var replacement_year = projected_lifespan(asset.type) + parseInt(asset.year(year));
            var measure = weight_metric(asset, year);
            var raw_cost = SGR.raw_adjusted_cost(asset.type,
                                                 year-parseInt(asset.year(year)),
                                                 asset.price);
            investment += SGR.replacement_cost(asset.type,
                                               year-parseInt(asset.year(year)),
                                               asset.price);
            if (replacement_year === year) {
                gmbb.bad += measure;
                if (constrained) {
                    bad_queue.push([asset, measure, raw_cost]);
                }
            }
            else if (replacement_year < year) {
                gmbb.backlog += measure;
                if (constrained) {
                    backlog_queue.push([asset, measure, raw_cost]);
                }
            }
            else if (replacement_year === year + 1) {
                gmbb.marginal += measure;
                if (constrained) {
                    marginal_queue.push([asset, measure, raw_cost]);
                }
            }
            else
                gmbb.good += measure;
        }
        
        var total = gmbb.good + gmbb.bad + gmbb.marginal + gmbb.backlog;
        for (var i in gmbb) gmbb[i] /= total;
        
        if (constrained) {
            var budget = yearly_budget;
            bad_queue.sort(compare);
            backlog_queue.sort(compare);
            marginal_queue.sort(compare);
            var queue = backlog_queue.concat(marginal_queue.concat(bad_queue));
            
            while (budget > 0 && queue.length > 0) {
                var i = queue.length-1;
                while (i >= 0 && queue[i][2] > budget)
                    i--;
                if (i < 0) break;
                var replaced = queue.splice(i,1)[0];
                replaced[0].years.push(year);
                budget -= replaced[2];
            }
            
            gmbb.investment = yearly_budget - budget;
        }
        else {
            gmbb.investment = investment;
        }
        
        return gmbb;
    }
    
    /*****************************
        UTILS AND EXPORTS
    *****************************/
        
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
    
    var system_metric = {
        gmbb: function (years, options) {
            return per_year(GMBB, years, options);
        }
    };
    
    return {
        csv: $.extend(true,{},csv),
        format: format,
        system_metric: system_metric
    };
};