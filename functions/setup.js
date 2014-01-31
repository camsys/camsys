/******************
    DEFAULTS
******************/

var startYear = 1990,
    currentYear = 2013,
    endYear = 2020,
    threshold = 80,
    yearly_budget = 10000000,
    area_bar_metric = function (asset, year) {
        // ADJUSTED PRICE * LOG(USAGE METRIC)
        return asset.price(year) * Math.log(asset.usage());
    },
    area_bar_comparator = function (a, b, year) {
        // FASTER DECAY HIGHER PRIORITY
        return b.decay_rate(year) - a.decay_rate(year);
    },
    sunburst_metric = function (asset, year) {
        // actual amount invested/projected to invest
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
    // transition durations
    ldur = 750, mdur = 500, sdur = 100;

/******************
    CONFIG FUNCTION
******************/

// MULTI-THREADED CALCULATIONS
var worker = new Worker('functions/worker.js');
worker.onerror = function(e) {
    console.log(e);
}

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
    d3.csv('data/sample_data.csv', function (csv) {
        var data = load_data(csv);
        area_bar(data);
        sunburst(data);
        
        // LOAD DATA INTO WORKER THREAD
        worker.postMessage({request: 'load_data',
                            csv: JSON.stringify(csv),
                            vars: {
                                currentYear: currentYear,
                                area_bar_metric: area_bar_metric+'',
                                area_bar_comparator: area_bar_comparator+'',
                                yearly_budget: yearly_budget
                            }});
        
        $('#calculator input').off();
        $('#calculator input').on('keyup', function(e) {
            if (e.which === 13) {
                var value = parseInt($(this).val());
                var target = $(this).attr('for');
                var func = $(this).attr('id');
                $('#'+target).css('background-color', 'lightgray');
                
                // REQUEST CALCULATION FROM WORKER THREAD
                worker.onmessage = function(e) {
                    $('#'+target).val(e.data);
                    $('#'+target).css('background-color', '');
                };
                worker.postMessage({request: 'calculate', func: func, value: value});
            }
        });
    });
}

/******************
    MODAL SETUP
******************/

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
    
        // fade in visuals
        d3.select('#visuals')
            .style('opacity', 0)
            .transition()
            .duration(ldur)
            .style("opacity", 1);
        
        d3.selectAll('#notes, #title, #titlebar').transition()
            .duration(ldur).style('opacity', 1);
    },
    hide: {
        effect: 'fade',
        duration: sdur
    }
});

$('#config-toggle').on('click', function () {
    $('#config-form').dialog('open');
});

/******************
    DOC SETUP
******************/

// buttons
//$('.btn').button();
$('#github').on('click', function() {
    window.open('https://github.com/lu16j/camsys');
});
$('#calculator-toggle').on('click', function() {
    $(this).text($(this).text() === 'Show Calculator' ? 'Hide Calculator' : 'Show Calculator');
    $('#calculator').toggleClass('hidden');
});

// initial hide
d3.selectAll('#notes, #title, #titlebar').style('opacity', 0);
    
// track detail tooltips
$('#visuals').tooltip({
    track: true,
    show: false,
    hide: false
});

// close dialog on enter
$('#config-form input').on('keyup', function(e) {
    if (e.which === 13)
        $('#config-form').dialog('close');
});
    
// preserve aspect ratio on resize
$(window).on('resize', function() {
    $('#area_bar').css('height', $('#area_bar').width()/5*3);
    $('#sunburst').css('height', $('#area_bar').height());
});