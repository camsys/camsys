var area_bar_updater;

// http://bl.ocks.org/mbostock/3943967
function area_bar(data) {
    
    var jqcontainer = $('#area_bar');
    var container = d3.select('#area_bar');
    jqcontainer.css('height', jqcontainer.width()/5*3);
    
    /************************
        DATA SETUP
    ************************/
    
    // set the starting x value and constraint
    var startingYear = Math.min(startYear, currentYear);
    var constrained = yearly_budget < Infinity;
    
    // generate historical data
    var historical_data = Generator.generate_history(startYear, currentYear-1, constrained);
    
    // get projected data for future years
    var years = [];
    for (var year = currentYear; year <= endYear; year++)
        years.push(year);
    var projected_data = data.system_metric.gmbb(years, {budget: yearly_budget,
                                                         metric: area_bar_metric});
    
    // set up layered data array
    var layer_data = [];
    var index_mapping = {};
    var index = 0;
    for (var condition in projected_data[currentYear]) {
        if (['investment', 'children'].indexOf(condition) < 0) {
            layer_data.push([]);
            index_mapping[condition] = index;
            index += 1;
        }
    }
    
    // merge historical and projected data
    var merged_data = $.extend({}, historical_data, projected_data);
    for (var year in merged_data) {
        for (var condition in index_mapping) {
            layer_data[index_mapping[condition]].push({
                x: parseInt(year),
                y: merged_data[year][condition]*100,
                ry: merged_data[year].investment
            });
        }
    }
    
    /************************
        D3 SETUP
    ************************/
    
    var n = 4, // number of layers
        m = endYear-startingYear, // number of samples per layer
        stack = d3.layout.stack(),
        layers = stack(d3.range(n).map(function(i) { return layer_data[i]; })),
        yMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); }),
        ryMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.ry; }); });
    
    ryMax = constrained ? yearly_budget : ryMax;
    
    var margin = {top: 40, right: 60, bottom: 20, left: 40},
        width = jqcontainer.width() - margin.left - margin.right,
        height = jqcontainer.height() - margin.top - margin.bottom;
    
    var xScale = d3.scale.ordinal()
        .domain(d3.range(startingYear, endYear+1))
        .rangeRoundBands([0, width], .06);
    
    var yScale = d3.scale.linear()
        .domain([0, yMax])
        .range([height, 0]);
    
    var ryScale = d3.scale.linear()
        .domain([0, ryMax])
        .range([height, 0]);
    
    var gmbbColors = ["#22bb45", "#edc244", "#fc9247", "#c14540"];
    
    var legendColor = d3.scale.ordinal()
        .domain(d3.keys(index_mapping))
        .range(gmbbColors);
    
    var layerColor = d3.scale.ordinal()
        .domain(d3.values(index_mapping))
        .range(gmbbColors);
    
    var xAxisValues = [startingYear];
    
    while (xAxisValues[xAxisValues.length-1] <= endYear-5)
        xAxisValues.push(xAxisValues[xAxisValues.length-1]+5);
    
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .tickSize(0)
        .tickPadding(6)
        .tickValues(xAxisValues)
        .orient("bottom");
    
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .tickSize(5)
        .tickPadding(2)
        .orient("left");
    
    var money_levels = ' KMBT'; // monetary abbreviations
    var ryAxis = d3.svg.axis()
        .scale(ryScale)
        .tickSize(5)
        .tickPadding(2)
        .tickFormat(function(d) {
            for (var i=0; i<money_levels.length; i++)
                if (d/Math.pow(1000,i) < 1000)
                    return d/Math.pow(1000,i) + money_levels[i];
            return '???';
        })
        .orient("right");
    
    /************************
        PRIMARY SVG SETUP
    ************************/
    
    var svg = container.append("svg")
        .attr('viewBox', '0 0 '+jqcontainer.width()+' '+jqcontainer.height())
        .attr("title", "...")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var layer = svg.selectAll(".layer")
        .data(layers)
      .enter().append("g")
        .attr("class", "layer")
        .style("fill", function(d, i) { return layerColor(i); });
    
    var rect = layer.selectAll("rect")
        .data(function(d) { return d; })
      .enter().append("rect")
        .attr('class', function(d, i) { return 'rect'+i; })
        .attr("x", function(d) { return xScale(d.x); })
        .attr("y", height)
        .attr("width", xScale.rangeBand())
        .attr("height", 0)
        .on("click", update_year)
        .on('mouseover', function(d, i) {
            if (d3.event.shiftKey)
                update_year(d);
            update_tooltip(d, i);
            layer.selectAll('.rect'+i).style('opacity', 0.7);
        })
        .on('mouseleave', function(d, i) {
            layer.selectAll('.rect'+i)
                .transition().ease('linear')
                .style('opacity', 1);
        });
    
    var threshold_mask = svg.append("rect")
        .attr("x", xScale(startingYear))
        .attr("y", yScale(100))
        .attr("width", xScale(endYear) + xScale.rangeBand() - xScale(startingYear))
        .attr("height", yScale(threshold) - yScale(100))
        .attr("fill", "white")
        .style("opacity", 0.5)
        .style("pointer-events", "none");
    
    /************************
        AXES AND LABELS
    ************************/
    
    var x_axis = svg.append("g")
        .attr("class", "xaxis axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    x_axis.append("text")
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + width/2 + "," + 1.5*margin.bottom + ")")
        .text("Year");
    
    var y_axis = svg.append("g")
        .attr("class", "yaxis axis")
        .call(yAxis);
    y_axis.append("text")
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-90) translate(" + -height/2 + "," + -0.75*margin.left + ")")
        .text("% Assets");
    
    var ry_axis = svg.append("g")
        .attr("class", "ryaxis axis")
        .attr("transform", "translate(" + width + ",0)")
        .call(ryAxis);
    ry_axis.append("text")
        .style("text-anchor", "middle")
        .attr("transform", "rotate(90) translate(" + height/2 + "," + -0.75*margin.right + ")")
        .text("$ Investment");
    
    /************************
        LEGENDS SETUP
    ************************/
    
    var bar_legend = svg.selectAll(".legend")
        .data(d3.keys(index_mapping))
        .enter().append("g");
    bar_legend.append("rect")
        .attr("x", function(d, i) { return 80 * i; })
        .attr("y", -15)
        .attr('width', 10)
        .attr('height', 10)
        .style('fill', function(d) { return legendColor(d); });
    bar_legend.append("text")
        .attr("x", function(d, i) { return 15 + 80 * i; })
        .attr("y", -7)
        .text(function(d) { return d; });
    
    var path_legend = svg.selectAll('.path_legend')
        .data([['projection','green','lightgreen'],['investment','black','gray']])
        .enter().append('g')
        .attr('transform', 'translate('+(width-160)+',-12)');
    path_legend.append('rect')
        .attr('x', function(d, i) { return i * 80; })
        .attr('height', 5)
        .attr('width', 15)
        .attr('fill', function(d) { return d[1]; });
    path_legend.append('rect')
        .attr('x', function(d, i) { return i * 80 + 2; })
        .attr('y', 1)
        .attr('height', 3)
        .attr('width', 11)
        .attr('fill', function(d) { return d[2]; });
    path_legend.append('text')
        .attr('x', function(d, i) { return i * 80 + 20; })
        .attr('y', 5)
        .text(function(d) { return d[0]; });
    
    /************************
        INDICATOR SETUP
    ************************/
    
    var polygon = function(d) {
        return d.map(function(d) {
            return [d.x, d.y].join(",");
        }).join(" ");
    };
    
    var indicator = svg.append("polygon")
        .datum([{x: 0, y: -xScale.rangeBand()/2},
                {x: -xScale.rangeBand()/2, y: 0},
                {x: xScale.rangeBand()/2, y: 0}])
        .attr('class', 'indicator')
        .attr("points", polygon)
        .attr("transform", "translate("+(xScale(currentYear)+xScale.rangeBand()/2)+","+height+")")
        .attr("fill", "black");
    
    /************************
        PATHS SETUP
    ************************/
    
    var regression_points = [];
    
    for (var i in layers[0]) {
        if (layers[0][i].x < currentYear)
            regression_points.push([layers[0][i].x, layers[0][i].y]);
    }
    
    var trajectory = function(year) {
        var ab = Util.linear_regression(regression_points);
        return Math.max(0, Math.min(100, ab[0]*year+ab[1]));
    };
    
    var flat_line = d3.svg.line()
        .x(function(d) { return xScale(d.x) + xScale.rangeBand() / 2; })
        .y(function(d) { return height; })
        .interpolate('monotone');
    
    var division_line = d3.svg.line()
        .x(function(d) { return xScale(currentYear) - 1; })
        .y(function(d) { return yScale(d.x); });
    
    var investment_line = d3.svg.line()
        .x(function(d) { return xScale(d.x) + xScale.rangeBand() / 2; })
        .y(function(d) { return ryScale(d.ry); })
        .interpolate('monotone');
    
    var trajectory_line = d3.svg.line()
        .x(function(d) { return xScale(d.x) + xScale.rangeBand() / 2; })
        .y(function(d) { return yScale(trajectory(d.x)); });
    
    var division_path = svg.append("path")
        .datum([{x: 0}, {x: 100}])
        .attr("class", "line")
        .attr("d", division_line)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("fill", "none");
    
    var investment_path = svg.append("g")
        .datum(layers[0])
        .attr("stroke-linecap", "round")
        .attr("fill", "none");
    investment_path.append("path")
        .attr("class", "line")
        .attr("d", flat_line)
        .attr("stroke", "black")
        .attr("stroke-width", 5);
    investment_path.append("path")
        .attr("class", "line")
        .attr("d", flat_line)
        .attr("stroke", "gray")
        .attr("stroke-width", 3);
    
    var trajectory_path = svg.append("g")
        .datum([{x: startingYear}, {x: endYear}])
        .attr("fill", "none")
        .attr("stroke-linecap", "round");
    trajectory_path.append("path")
        .attr("class", "line")
        .attr("d", flat_line)
        .attr("stroke", "green")
        .attr("stroke-width", 5);
    trajectory_path.append("path")
        .attr("class", "line")
        .attr("d", flat_line)
        .attr("stroke", "lightgreen")
        .attr("stroke-width", 3);
    
    /************************
        INITIAL TRANSITIONS
    ************************/
    
    investment_path.selectAll("path")
        .transition().duration(ldur)
        .attr("d", investment_line);
    
    trajectory_path.selectAll("path")
        .transition().duration(ldur)
        .attr("d", trajectory_line);
    
    rect.transition()
        .delay(function(d, i, j) { return (i+j) * ldur/(m+n); })
        .attr("y", function(d) { return yScale(d.y0 + d.y); })
        .attr("height", function(d) { return yScale(d.y0) - yScale(d.y0 + d.y); });
    
    /************************
        UPDATE FUNCTIONS
    ************************/
    
    function update_year(d) {
        sunburst_updater(d.x);
        svg.select('.indicator')
            .transition().duration(mdur).ease('cubic-out')
            .attr('transform', 'translate('+(xScale(d.x)+xScale.rangeBand()/2)+','+height+')');
    }
    
    function update_tooltip(d, i) {
        var tooltip_html = '<b>'+d.x+'</b>' + '<br>';
        for (var j in index_mapping) {
            var percent = Math.round(layers[index_mapping[j]][i].y*100)/100;
            tooltip_html += '<i>'+j+'</i>' + ': ' + percent + '%<br>';
        }
        tooltip_html += Util.format_dollars(d.ry);
        $('.ui-tooltip-content').html(tooltip_html);
    }
    
    function search(node, name) {
        if (node.children === undefined)
            return undefined;
        var result = node.children[name];
        if (result === undefined) {
            for (var i in node.children) {
                var result = search(node.children[i], name) || result;
            }
        }
        return result;
    }
    
    area_bar_updater = function (name) {
        // set data
        for (var year in projected_data) {
            var root = projected_data[year];
            var result = search(root, name) || root;
            merged_data[year] = result;
        }
        
        // re-populate data
        for (var i in layer_data)
            layer_data[i] = [];
        for (var year in merged_data) {
            for (var condition in index_mapping) {
                layer_data[index_mapping[condition]].push({
                    x: parseInt(year),
                    y: merged_data[year][condition]*100,
                    ry: merged_data[year].investment
                });
            }
        }
        
        // set D3
        layers = stack(d3.range(n).map(function(i) { return layer_data[i]; }));
        ryMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.ry; }); });
        ryMax = constrained ? yearly_budget : ryMax;
        
        ryScale.domain([0, ryMax]);
        ryAxis.scale(ryScale);
        
        // transition
        ry_axis.transition().duration(ldur).ease('cubic-out')
            .call(ryAxis);
        layer.data(layers);
        rect.data(function(d) { return d; })
            .transition().duration(ldur).ease('cubic-out')
            .attr("x", function(d) { return xScale(d.x); })
            .attr("y", function(d) { return yScale(d.y0 + d.y); })
            .attr("height", function(d) { return yScale(d.y0) - yScale(d.y0 + d.y); });
        investment_line
            .y(function(d) { return ryScale(d.ry); });
        investment_path
            .selectAll("path").datum(layers[0])
            .transition().duration(ldur).ease('cubic-out')
            .attr("d", investment_line);
    }
}