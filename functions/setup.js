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
    },
    ldur = 750, mdur = 500, sdur = 100;

/******************
    CONFIG FUNCTION
******************/

function config(values) {
    
    // evaluate each config option
    for (var i in values) {
        try {
            eval(i+' = '+values[i]+' || '+i);
        } catch (e) {
            eval(i+' = undefined');
        }
    }

    // load and display data
    var data = load_data(sample_data);
    area_bar(data);
    sunburst(data);
    
    d3.select('body').style("opacity", 0);
    d3.select('body').transition()
        .duration(ldur)
        .style("opacity", 1);
    
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
    modal: true,
    resizable: false,
    draggable: false,
    buttons: {
        Okay: function() {
            $(this).dialog('close');
        }
    },
    beforeClose: function() {
        var values = {};
        
        // read values and configure
        $('.config-field').each(function() {
            values[$(this).attr('id')] = $(this).val();
        });
        config(values);
        
        $('#notes').animate({opacity: 1}, ldur);
    },
    hide: {
        effect: 'fade',
        duration: sdur
    }
});

// close dialog on enter
$('#config-form input').on('keyup', function(e) {
    if (e.which === 13)
        $('#config-form').dialog('close');
});