// DEFAULT CONFIG
var startYear = 1990,
    currentYear = 2013,
    endYear = 2020,
    threshold = 80,
    yearly_budget = 10000000,
    weight_metric = function (asset, year) {
        return SGR.raw_adjusted_cost(asset.type, year-asset.year(year), asset.price) * asset.volume;
    },
    sunburst_function = function (asset, year) {
        return SGR.replacement_cost(asset.type, year-asset.year(year), asset.price);
    },
    color_scheme = {
        total: '#393b79',
        infrastructure: '#843c39',
        building_utilities: '#de9ed6',
        maintenance_building: '#ce6dbd',
        overhead: '#a55194',
        parking: '#7b4173',
        street: '#ad494a',
        systems: '#d6616b',
        track: '#e7969c',
        utility_building: '#7b4173',
        vehicle: '#636363',
        bus: '#9e9ac8',
        light_rail: '#969696'
    };

// MODAL CONFIG FUNCTION
function config(values) {
    for (var i in values) {
        try {
            eval(i+' = '+values[i]+' || '+i);
        } catch (e) {
            console.log(e);
        }
    }

//    var data = load_data(generate_assets(100));
    var data = load_data(sample_data);
//    d3.csv('http://web.mit.edu/lu16j/www/camsys/sample_data.csv', function(csv) {
//        
//        for (var i in csv) {
//            csv[i].years = csv[i].years.split(',');
//            for (var j in csv[i].years) csv[i].years[j] = parseInt(csv[i].years[j]);
//            csv[i].price = parseInt(csv[i].price);
//            csv[i].volume = parseInt(csv[i].volume);
//        }
//        
//        var data = load_data(csv);
        
    area_bar(data);
    sunburst(data);
    
    $('#visuals').tooltip({
        track: true,
        show: false,
        hide: false
    });
        
//    });
}

/******************
    MODAL SETUP
******************/

// display default values
$('#config-form input').each(function() {
    $(this).attr('value', eval($(this).attr('id'))+'');
});

// show dialog
$('#config-form').dialog({
    autoOpen: true,
    height: 500,
    width: 500,
    modal: true,
    buttons: {
        Okay: function() {
            $(this).dialog('close');
        }
    },
    close: function() {
        var values = {};
        $('.config-field').each(function() {
            values[$(this).attr('id')] = $(this).val();
        });
        config(values);
    }
});