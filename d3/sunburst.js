var sunburst_updater;

// http://bl.ocks.org/mbostock/4348373
function sunburst(data) {
    
    var container = d3.select('#sunburst');
    var jqcontainer = $('#sunburst');
    var title = $('#title');
    
    /************************
        DATA SETUP
    ************************/
        
    var root = data.format.flare(function (asset) {
        return sunburst_function(asset, currentYear);
    });
    
    var old = {};
    
    /************************
        D3 SETUP
    ************************/
    
    var padding = 25;
    
    var width = jqcontainer.width(),
        height = $('#area_bar').height(),
        radius = Math.min(width, height) / 2 - 2 * padding;
    
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
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
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
        .on("click", click)
        .on("mousemove", update_tooltip);
    
    /************************
        LEGENDS SETUP
    ************************/
    
    title.html('<h2>'+currentYear+'</h2>'
               +'<p>'+format_dollars(partitioned[0].value)+'</p>');
    
    var legend = container.append('div')
        .attr('class', 'legend floating')
        .style('left', jqcontainer.offset().left+'px')
        .style('top', jqcontainer.offset().top+padding+'px');
    legend.append('ul').selectAll('li')
        .data(d3.keys(color_scheme))
        .enter().append('li')
        .attr('class', function(d) { return d.replace(' ','_'); })
        .on('mouseover', function(d) {
            d3.select(this).classed('highlighted', true);
        })
        .on('mouseleave', function(d) {
            d3.select(this).classed('highlighted', false);
        })
        .on('click', function(d) {
            svg.select('.'+d).each(function(d) {
                if (d.dx > 0)
                    click(d);
            });
        })
        .append('svg').attr('width', 10).attr('height', 10)
        .append('rect').attr('width', 10).attr('height', 10)
        .attr('fill',function(d) { return color_scheme[d]; });
    legend.selectAll('li')
        .append('text')
        .text(function(d) { return ' '+d.replace('_',' '); })
        .style('color', function(d) { return color_scheme[d]; });
    
    var legend_toggle = container.append('img')
        .attr('class', 'toggle floating')
        .attr('src', 'images/list.png')
        .attr('width', width/10)
        .attr('height', width/10)
        .style('top', jqcontainer.offset().top+10+'px')
        .style('left', jqcontainer.offset().left+width*9/10+'px')
        .on('click', toggle_legend);
    
    /************************
        INITIAL TRANSITIONS
    ************************/
    
    d3.select('body').style("opacity", 0);
    d3.select('body').transition()
        .duration(750)
        .style("opacity", 1);
    
    /************************
        UPDATE FUNCTIONS
    ************************/
    
    sunburst_updater = function(year) {
        if (year >= currentYear) {
            root = data.format.flare(function (asset) {
                return sunburst_function(asset, year);
            });
            partitioned = partition.nodes(root);
            path.data(partitioned)
                .transition().duration(500).ease('cubic-out')
                .attrTween("d", yearTween);
            title.html('<h2>'+year+'</h2>'
                   +'<p>'+format_dollars(partitioned[0].value)+'</p>');
        }
    }
    
    function click(d) {
        path.transition()
            .duration(750)
            .attrTween("d", zoomTween(d));
    }
    
    function update_tooltip(d) {
        d3.select(".ui-tooltip-content")
            .html('<b>'+(d.children ? d.name.replace('_',' ') : d.name)
                  +'</b><br>'+format_dollars(d.value));
    }
    
    function toggle_legend() {
        if (legend.style('top') === '10px')
            legend.transition().ease('cubic-out')
                .style('top', jqcontainer.offset().top+padding+'px')
                .style('visibility', 'hidden');
        else
            legend.transition().ease('cubic-out')
                .style('top', '10px')
                .style('visibility', 'visible');
    }
    
    function yearTween(a) {
        var i = d3.interpolate(old[a.name], a);
        return function(t) {
            var b = i(t);
            old[a.name] = {
                x: b.x,
                y: b.y,
                dx: b.dx,
                dy: b.dy
            };
            return arc(b);
        };
    }
    
    function zoomTween(d) {
        var xd = d3.interpolate(xScale.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(yScale.domain(), [d.y, 1]),
            yr = d3.interpolate(yScale.range(), [d.y ? 20 : 0, radius]);
        return function(d, i) {
            return i
                ? function(t) { return arc(d); }
                : function(t) { xScale.domain(xd(t));
                                yScale.domain(yd(t)).range(yr(t));
                                return arc(d); };
        };
    }
}