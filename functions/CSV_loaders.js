var CSV = function (csv) {
    
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
                var year = asset.year;
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
                        size: size,
                        year: year
                    });
                }
            }
            for (var i in json_data.children) {
                for (var j in json_data.children[i].children) {
                    name = json_data.children[i].children[j].name.toLowerCase();
                    while (name.indexOf('_') >= 0)
                        name = name.replace('_', ' ');
                    json_data.children[i].children[j].name = name;
                }
            }
            return json_data;
        }
    };
    
    function total_investment(year) {
        var total = 0.;
        for (var i in csv) {
            total += SGR.replacement_cost(csv[i].type,
                                          year-parseInt(csv[i].year),
                                          csv[i].price);
        }
        return total;
    }
    
    function GMBB(year) {
        var gmbb = {
            good: 0.,
            marginal: 0.,
            bad: 0.,
            backlog: 0.,
        };
        
        for (var i in csv) {
            var asset = csv[i];
            var replacement_year = projected_lifespan(asset.type) + parseInt(asset.year);
            var measure = weight_metric(asset, year);
            if (replacement_year === year)
                gmbb.bad += measure;
            else if (replacement_year < year)
                gmbb.backlog += measure;
            else if (replacement_year === year + 1)
                gmbb.marginal += measure;
            else
                gmbb.good += measure;
        }
        
        var total = gmbb.good + gmbb.bad + gmbb.marginal + gmbb.backlog;
        for (var i in gmbb) gmbb[i] /= total;
        
        return gmbb;
    }
        
    function per_year(func, years) {
        if (years[0] === undefined)
            return func(years);
        else {
            var per_year_data = {};
            for (var i in years) {
                var year = years[i];
                per_year_data[year] = func(year);
            }
            return per_year_data;
        }
    }
    
    var system_metric = {
        // percent/ratio assets in good repair
        // percent/ratio dollars in good repair
        // investment needed
        // % of original investment needed
        'gmbb': function (years) {
            return per_year(GMBB, years);
        },
        'total investment': function (years) {
            return per_year(total_investment, years);
        }
    };
    
    return {
        csv: $.extend(true,{},csv),
        format: format,
        system_metric: system_metric
    };
};