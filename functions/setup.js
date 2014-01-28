/******************
    DEFAULTS
******************/

var startYear = 1990,
    currentYear = 2013,
    endYear = 2020,
    threshold = 80,
    yearly_budget = 10000000,
    area_bar_metric = function (asset, year) {
        return asset.price(year) * Math.log(asset.usage());
    },
    sunburst_metric = function (asset, year) {
        return asset.amount_invested(year);
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

/******************
    CONFIG FUNCTION
******************/

function config(values) {
    
    // evaluate each config option
    for (var i in values) {
        try {
            eval(i+' = '+values[i]+' || '+i);
        } catch (e) {
            console.log(e);
        }
    }

    // load and display data
    var data = load_data(sample_data);
    area_bar(data);
    sunburst(data);
    
    // track detail tooltips
    $('#visuals').tooltip({
        track: true,
        show: false,
        hide: false
    });
    
    // preserve aspect ratio on resize
    $(window).on('resize', function() {
        $('#area_bar').css('height', $('#area_bar').width()/5*3);
        $('#sunburst').css('height', $('#area_bar').height());
    });
}

/******************
    MODAL SETUP
******************/

// initial hide
$('#notes').css('opacity', 0);

// display default values in input boxes
$('#config-form input').each(function() {
    $(this).attr('value', eval($(this).attr('id'))+'');
});

// show dialog
$('#config-form').dialog({
    autoOpen: true,
    height: 500,
    width: 500,
    modal: true,
    resizable: false,
    buttons: {
        Okay: function() {
            var values = {};
            
            // read values and configure
            $('.config-field').each(function() {
                values[$(this).attr('id')] = $(this).val();
            });
            config(values);
            
            $('#notes').animate({opacity: 1}, 750);
            $(this).dialog('close');
        }
    },
    hide: {
        effect: 'fade',
        duration: 100
    }
});