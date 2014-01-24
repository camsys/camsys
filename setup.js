// DEFAULT CONFIG
var startYear = 1990,
    currentYear = 2013,
    endYear = 2020,
    threshold = 80,
    yearly_budget = 10000000,
    weight_metric = function (asset, year) {
        return asset.price * Math.pow(1.03, year-asset.year(year)) * asset.volume;
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
    startYear = parseInt(values.startYear) || startYear;
    endYear = parseInt(values.endYear) || endYear;
    threshold = parseInt(values.threshold) || threshold;
    yearly_budget = parseInt(values.yearly_budget) || yearly_budget;
    try {
        eval('weight_metric = '+(values.weight_metric || weight_metric));
    } catch (e) {}

//    var csv = CSV(generate_assets(100));
    var csv = CSV(sample_data);
//    d3.csv('http://web.mit.edu/lu16j/www/camsys/sample_data.csv', function(csv) {
//        
//        for (var i in csv) {
//            csv[i].years = csv[i].years.split(',');
//            for (var j in csv[i].years) csv[i].years[j] = parseInt(csv[i].years[j]);
//            csv[i].price = parseInt(csv[i].price);
//            csv[i].volume = parseInt(csv[i].volume);
//        }
//        
//        csv = CSV(csv);
        
    area_bar(csv);
    sunburst(csv);
    
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
$('#config-form textarea').each(function() {
    $(this).text(eval($(this).attr('id'))+'');
});

// enable tabbing in code input
$('.code').on('keydown', function(e) {
    if(e.which === 9) {
        e.preventDefault();
        
        var start = $(this).get(0).selectionStart;
        var end = $(this).get(0).selectionEnd;
    
        // set textarea value to: text before caret + tab + text after caret
        $(this).val($(this).val().substring(0, start)
                    + "     "
                    + $(this).val().substring(end));
    
        // put caret at right position again
        $(this).get(0).selectionStart = 
        $(this).get(0).selectionEnd = start + 4;
    }
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