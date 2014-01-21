// http://bl.ocks.org/mbostock/4348373

var sunburst_updater;
function sunburst(csv) {
    var container = $('#sunburst');
    
    var width = container.width(),
        height = width,
        radius = Math.min(width, height) / 2 - 50;
    
    var x = d3.scale.linear()
        .range([0, 2 * Math.PI]);
    
    var y = d3.scale.sqrt()
        .range([0, radius]);
    
    var color = d3.scale.category20b();
    
    var svg = d3.select("#sunburst").append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")")
        .attr("title",' ');
    
    // http://bl.ocks.org/mbostock/5944371
    var partition = d3.layout.partition()
        .value(function(d) { return d.size; })
        .sort(function(a, b) { return d3.ascending(a.name, b.name); });
    
    var arc = d3.svg.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
        .innerRadius(function(d) { return Math.max(0, y(d.y)); })
        .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });
      
    var data = csv;
        
    var root = data.format.flare(function (asset) {
        return SGR.replacement_cost(asset.Type, currentYear-asset.Year, asset['purchase price']);
    });
    
    var partitioned = partition.nodes(root);
    var old = {};
    
    var path = svg.selectAll("path")
        .data(partitioned)
        .enter().append("path")
        .attr("d", arc).each(function(d){
            old[d.name] = {
                x: d.x,
                y: d.y,
                dx: d.dx,
                dy: d.dy
            };
        })
        .style("fill", function(d) { return color(d.name); })
        .on("click", click)
        .on("mouseenter", update_tooltip);
    
    var legend = $('#title');
    legend.html('<h2>'+currentYear+'</h2>'
               +'<p>'+format_dollars(partitioned[0].value)+'</p>');
    
    sunburst_updater = function(year) {
        if (year >= currentYear) {
            root = data.format['flare'](function (asset) {
                return SGR.replacement_cost(asset.Type, year-asset.Year, asset['purchase price']);
            });
            partitioned = partition.nodes(root);
            path.data(partitioned)
                .transition().duration(500)
                .attrTween("d", yearTween);
            legend.html('<h2>'+year+'</h2>'
                   +'<p>'+format_dollars(partitioned[0].value)+'</p>');
        }
    }
    
    d3.select('body').style("opacity", 0);
    d3.select('body').transition()
        .duration(750)
        .style("opacity", 1);
    
    function yearTween(a) {
        var i = d3.interpolate(old[a.name], a);
        return function(t) {
            var b = i(t);
            old[a.name].x = b.x;
            old[a.name].y = b.y;
            old[a.name].dx = b.dx;
            old[a.name].dy = b.dy;
            return arc(b);
        };
    }
    
    function click(d) {
        path.transition()
            .duration(750)
            .attrTween("d", arcTween(d));
    }
    
    function update_tooltip(d) {
        d3.select(".ui-tooltip-content")
            .html('<b>'+d.name+'</b><br>'+format_dollars(d.value));
    }
    
    d3.select(self.frameElement).style("height", height + "px");
    
    // Interpolate the scales!
    function arcTween(d) {
        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
        return function(d, i) {
            return i
                ? function(t) { return arc(d); }
                : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
        };
    }
}