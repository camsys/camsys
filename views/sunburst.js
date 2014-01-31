var sunburst_updater;

// http://bl.ocks.org/mbostock/4348373
function sunburst(data) {
    
    var container = d3.select('#sunburst');
    var jqcontainer = $('#sunburst');
    jqcontainer.html('');
    var title = $('#title');
    jqcontainer.css('height', $('#area_bar').height());
    
    /************************
        DATA SETUP
    ************************/
        
    var root = data.format.flare(function (asset) {
        return sunburst_metric(asset, currentYear);
    });
    
    var old = {};
    
    var displayedYear = currentYear;
    
    /************************
        D3 SETUP
    ************************/
    
    var padding = 20;
    
    var width = jqcontainer.width(),
        height = jqcontainer.height(),
        radius = Math.min(width, height) / 2 - 2 * padding;
    
    // default domain [0,1]
    var xScale = d3.scale.linear()
        .range([0, 2 * Math.PI]);
    
    var yScale = d3.scale.sqrt()
        .range([0, radius]);
    
    var partition = d3.layout.partition()
        .value(function(d) { return d.size; })
        .sort(function(a, b) { return d3.ascending(a.name, b.name); });
    
    var partitioned = partition.nodes(root);
    
    var arc = d3.svg.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, xScale(d.x))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, xScale(d.x + d.dx))); })
        .innerRadius(function(d) { return Math.max(0, yScale(d.y)); })
        .outerRadius(function(d) { return Math.max(0, yScale(d.y + d.dy)); });
    
    var randomColor = d3.scale.category20b();
    
    function arcColor(d, i) {
        var self_color = color_scheme[d.name];
        if (self_color !== undefined)
            return self_color;
        
        var parent_color = color_scheme[d.parent.name];
        if (parent_color !== undefined)
            return i % 2 === 0
                ? d3.rgb(parent_color).brighter(Math.random())
                : d3.rgb(parent_color).darker(Math.random());
        
        return randomColor(d.name);
    }
    
    /************************
        PRIMARY SVG SETUP
    ************************/
    
    var svg = container.append("svg")
        .attr('viewBox', '0 0 '+width+' '+height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ") scale(0)")
        .attr("title",'...');
    
    var path = svg.selectAll("path")
        .data(partitioned)
        .enter().append("path")
        .attr('class', function(d) { return d.name.replace(' ','_'); })
        .attr("d", arc)
        .each(function(d){
            old[d.name] = {
                x: d.x,
                y: d.y,
                dx: d.dx,
                dy: d.dy
            };
        })
        .style("fill", arcColor)
        .on("click", zoom)
        .on("mousemove", update_tooltip);
    
    /************************
        LEGENDS SETUP
    ************************/
    
    // recursively populate hierarchical legend
    
    function populate(ul, node) {
        var child = ul.append('li')
            .attr('class', 'leaf fades')
            .classed(node.name, true)
            .classed('root', ul.classed('root'))
            .on('mouseover', function() {
                d3.select(this).classed('highlighted', true);
            })
            .on('mouseleave', function() {
                d3.select(this).classed('highlighted', false);
            })
            .on('click', function() {
                d3.event.stopPropagation();
                svg.select('.'+node.name).each(function(d) {
                    if (d.dx > 0)
                        zoom(d);
                });
            });
        child.append('svg').attr('width', 10).attr('height', 10)
            .append('rect').attr('width', 10).attr('height', 10)
            .attr('fill', color_scheme[node.name]);
        child.append('text')
            .text(' '+node.name.replace(/[_]/,' '))
            .style('color', color_scheme[node.name]);
        for (var i in node.children) {
            if (node.children[i].children) {
                child.classed('leaf', false);
                populate(child.append('ul'), node.children[i]);
            }
        }
    }
    
    var legend = container.append('div')
        .attr('class', 'legend floating hidden fades');
    populate(legend.append('ul').attr('class', 'root'), root);
    
    var legend_toggle = container.append('img')
        .attr('src', 'images/list.png')
        .attr('class', 'toggle floating')
        .attr('title', 'Legend')
        .on('click', toggle_legend);
    
    /************************
        INITIAL TRANSITIONS
    ************************/
    
    svg.transition().duration(ldur)
        .attr('transform', svg.attr('transform').replace('scale(0)', 'scale(1)'));
    
    /************************
        UPDATE FUNCTIONS
    ************************/
    
    var zoomed_name = 'total';
    var zoomed_node = partitioned[0];
    
    sunburst_updater = function(year) {
        if (year >= currentYear) {
            displayedYear = year;
            root = data.format.flare(function (asset) {
                return sunburst_metric(asset, year);
            });
            partitioned = partition.nodes(root);
            path.data(partitioned)
                .each(function(d) { zoomed_node = d.name === zoomed_name ? d : zoomed_node; })
                .transition().duration(mdur).ease('cubic-out')
                .attrTween('d', attrTween(zoomed_node));
            update_title();
        }
    }
    
    function update_title() {
        title.html('<h2>'+displayedYear+'</h2>'
               +'<p>'+zoomed_name+': '+Util.format_dollars(zoomed_node.value)+'</p>');
    }
    
    update_title();
    
    function zoom(d) {
        zoomed_name = d.name;
        zoomed_node = d;
        area_bar_updater(d.name);
        path.transition()
            .duration(mdur).ease('cubic-out')
            .attrTween("d", attrTween(d));
        update_title();
    }
    
    function update_tooltip(d) {
        d3.select(".ui-tooltip-content")
            .html('<b>'+(d.children ? d.name.replace('_',' ') : d.name)
                  +'</b><br>'+Util.format_dollars(d.value));
    }
    
    function toggle_legend() {
        legend.classed('hidden', !legend.classed('hidden'));
    }
    
    function attrTween(d) {
        // interpolate the scales for zooming
        var xd = d3.interpolate(xScale.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(yScale.domain(), [d.y, 1]),
            yr = d3.interpolate(yScale.range(), [d.y ? 20 : 0, radius]);
        
        return function(d, i) {
            // interpolate the coordinates year to year
            var interpolate = d3.interpolate(old[d.name], d);
            
            return i
                ? function(t) {
                        var b = interpolate(t);
                        old[d.name] = {
                            x: b.x,
                            y: b.y,
                            dx: b.dx,
                            dy: b.dy
                        };
                        return arc(b);
                    }
                : function(t) {
                        xScale.domain(xd(t));
                        yScale.domain(yd(t)).range(yr(t));
                        var b = interpolate(t);
                        old[d.name] = {
                            x: b.x,
                            y: b.y,
                            dx: b.dx,
                            dy: b.dy
                        };
                        return arc(b);
                    };
        };
    }
}