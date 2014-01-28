var System = function (assets) {
        
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
        
        // format data into the 'flare.json' format
        // found on many D3 examples
        flare: function (metric) {
            
            // define root
            var json_data = {
                name: "total",
                children: []
            };
            
            for (var i in assets) {
                var asset = assets[i];
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
    
    // calculates the good/marginal/bad/backlog
    // percentages per year
    function GMBB(year, options) {
        var constrained = options.constrained;
        var metric = options.metric || 1;
        
        var template = {
            good: 0,
            marginal: 0,
            bad: 0,
            backlog: 0,
            investment: 0
        };
        var gmbb = $.extend({}, template, {children:{}});
        
        var bad_queue = [];
        var backlog_queue = [];
        var marginal_queue = [];
        function compare(a,b) {
            return a[1] < b[1] ? 1 :
                a[1] > b[1] ? -1 : 0;
        }
        
        
        for (var i in assets) {
            var asset = assets[i];
            
            var serial = asset.serial();
            var type = asset.type();
            var clas = asset.class();
            
            if (gmbb.children[clas] === undefined)
                gmbb.children[clas] = $.extend({}, template, {children:{}});
            if (gmbb.children[clas].children[type] === undefined)
                gmbb.children[clas].children[type] = $.extend({}, template, {children:{}});
            gmbb.children[clas].children[type].children[serial] = $.extend({}, template);
            
            var replacement_year = asset.replacement_year(year);
            var measure = metric(asset, year);
            var raw_cost = asset.price(year);
            var condition;
            
            // determine state of repair by proximity to replacement year
            if (replacement_year === year) {
                condition= 'bad';
                bad_queue.push([asset, measure, raw_cost]);
            }
            else if (replacement_year < year) {
                condition= 'backlog';
                backlog_queue.push([asset, measure, raw_cost]);
            }
            else if (replacement_year === year + 1) {
                condition= 'marginal';
                marginal_queue.push([asset, measure, raw_cost]);
            }
            else
                condition= 'good';
            gmbb[condition] += measure;
            gmbb.children[clas][condition] += measure;
            gmbb.children[clas].children[type][condition] += measure;
            gmbb.children[clas].children[type].children[serial][condition] += measure;
        }
        
        // normalize
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
        
        var budget = yearly_budget;
        
        while (budget > 0 && queue.length > 0) {
            var i = queue.length-1;
            while (i >= 0 && queue[i][2] > budget)
                i--; // skip over investments greater than available budget
            if (i < 0) break; // all possible investments made\
            
            // replace asset
            var replaced = queue.splice(i,1)[0];
            var asset = replaced[0];
            var serial = asset.serial();
            var type = asset.type();
            var clas = asset.class();
            var cost = replaced[2];
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
}