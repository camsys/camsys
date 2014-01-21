function area_bar(csv, historical) {
    var startingYear = currentYear;
    if (historical)
        startingYear = startYear;
    
    var years = [];
    for (var year = currentYear; year <= endYear; year++)
        years.push(year);
    var yearly_gmbb_data = csv.system_metric.gmbb(years);
    var yearly_total_investment = csv.system_metric["total investment"](years);
    
    var historical_data = generate_history(startYear, currentYear-1);
    
    var data = [];
    var index_mapping = {};
    for (var i in yearly_gmbb_data) {
        if (data.length === 0) {
            var index = 0;
            for (var k in yearly_gmbb_data[i]) {
                data.push({
                    data: [],
                    label: k
                });
                index_mapping[k] = index;
                index += 1;
            }
            if (historical) {
                for (var j in historical_data) {
                    for (var l in historical_data[j]) {
                        if (l !== 'investment')
                            data[index_mapping[l]].data.push([parseInt(j),
                                                              historical_data[j][l],
                                                              historical_data[j]['investment']]);
                    }
                }
            }
        }
        for (var k in yearly_gmbb_data[i]) {
            data[index_mapping[k]].data.push([parseInt(i),
                                              yearly_gmbb_data[i][k],
                                              yearly_total_investment[i]]);
        }
    }
    
    // http://bl.ocks.org/mbostock/3943967
    var container = $('#area_bar');
        container.append('\
            <form>\
              <label><input type="radio" name="mode" value="grouped"> Grouped</label>\
              <label><input type="radio" name="mode" value="stacked" checked> Stacked</label>\
            </form>');
    
    var layer_data = [];
    for (var i in data) {
        layer_data.push([]);
        for (var j in data[i].data) {
            layer_data[i].push({
                x: data[i].data[j][0],
                y: data[i].data[j][1]*100,
                ry: data[i].data[j][2]
            });
        }
    }
    
    var n = 4, // number of layers
        m = endYear-startingYear, // number of samples per layer
        stack = d3.layout.stack(),
        layers = stack(d3.range(n).map(function(i) { return layer_data[i]; })),
        yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); }),
        yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); }),
        ryMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.ry; }); });
    
    var xAxisValues = [startingYear];
    
    while (xAxisValues[xAxisValues.length-1] <= endYear-5)
        xAxisValues.push(xAxisValues[xAxisValues.length-1]+5);
    
    var margin = {top: 40, right: 60, bottom: 20, left: 40},
        width = container.width() - margin.left - margin.right,
        height = container.width()/5*3 - margin.top - margin.bottom;
    
    var x = d3.scale.ordinal()
        .domain(d3.range(startingYear, endYear+1))
        .rangeRoundBands([0, width], .08);
    
    var y = d3.scale.linear()
        .domain([0, yStackMax])
        .range([height, 0]);
    
    var ry = d3.scale.linear()
        .domain([0, ryMax])
        .range([height, 0]);
    
    var colors = ["#22bb45", "#edc244", "#fc9247", "#c14540"];
    
    var color = d3.scale.ordinal()
        .domain(d3.values(index_mapping))
        .range(colors);
    
    var legendColors = d3.scale.ordinal()
        .domain(d3.keys(index_mapping))
        .range(colors);
    
    var xAxis = d3.svg.axis()
        .scale(x)
        .tickSize(0)
        .tickPadding(6)
        .tickValues(xAxisValues)
        .orient("bottom");
    
    var yAxis = d3.svg.axis()
        .scale(y)
        .tickSize(5)
        .tickPadding(2)
        .orient("left");
    
    var money_levels = 'LMBT';
    var ryAxis = d3.svg.axis()
        .scale(ry)
        .tickSize(5)
        .tickPadding(2)
        .tickFormat(function(d) {
            for (var i=0; i<money_levels.length; i++)
                if (d/Math.pow(1000,i+1) < 1000)
                    return d/Math.pow(1000,i+1) + money_levels[i];
            return '???';
        })
        .orient("right");
    
    var svg = d3.select("#area_bar").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + 2*margin.bottom)
        .attr("title", " ")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var layer = svg.selectAll(".layer")
        .data(layers)
      .enter().append("g")
        .attr("class", "layer")
        .style("fill", function(d, i) { return color(i); });
    
    var rect = layer.selectAll("rect")
        .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(d) { return x(d.x); })
        .attr("y", height)
        .attr("width", x.rangeBand())
        .attr("height", 0)
        .attr("fill", function(d) {
            return d.x < currentYear ? d3.rgb(this.parentNode.style.fill).darker() : '';
        })
        .on("click", function(d) { sunburst_updater(d.x); })
        .on('mouseenter', update_tooltip)
        .on('mouseover', function(d) {
            if (d3.event.shiftKey)
                sunburst_updater(d.x);
        });
    
    var legend = svg.selectAll(".legend")
        .data(d3.keys(index_mapping))
        .enter().append("g");
    legend.append("rect")
        .attr("x", function(d, i) { return 80 * i; })
        .attr("y", -15)
        .attr('width', 10)
        .attr('height', 10)
        .style('fill', function(d) { return legendColors(d); });
    legend.append("text")
        .attr("x", function(d, i) { return 15 + 80 * i; })
        .attr("y", -7)
        .text(function(d) { return d; });
    
    var regression_points = [];
    
    for (var i in layers[0]) {
        if (layers[0][i].x < currentYear)
            regression_points.push([layers[0][i].x, layers[0][i].y]);
    }
    
    var trajectory = function(year) {
        var ab = linear_regression(regression_points);
        return ab[0]*year+ab[1];
    };
    
    var flat_line = d3.svg.line()
        .x(function(d) { return x(d.x) + x.rangeBand() / 2; })
        .y(function(d) { return height; })
        .interpolate('basis');
    
    var threshold_line = d3.svg.line()
        .x(function(d) { return x(d.x) + x.rangeBand() / 2; })
        .y(function() { return y(80); });
    
    var investment_line = d3.svg.line()
        .x(function(d) { return x(d.x) + x.rangeBand() / 2; })
        .y(function(d) { return ry(d.ry); })
        .interpolate('basis');
    
    var trajectory_line = d3.svg.line()
        .x(function(d) { return x(d.x) + x.rangeBand() / 2; })
        .y(function(d) { return y(trajectory(d.x)); });
    
    var threshold_path = svg.append("path")
        .datum([{x: startingYear}, {x: endYear}])
        .attr("class", "line")
        .attr("d", flat_line)
        .attr("stroke", "lightgray")
        .attr("stroke-width", 1)
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
    
    threshold_path.transition()
        .duration(m * 20)
        .attr("d", threshold_line);
    
    investment_path.selectAll("path")
        .transition().duration(m * 20)
        .attr("d", investment_line);
    
    trajectory_path.selectAll("path")
        .transition().duration(m * 20)
        .attr("d", trajectory_line);
    
    rect.transition()
        .delay(function(d, i) { return i * 10; })
        .attr("y", function(d) { return y(d.y0 + d.y); })
        .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });
    
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    
    svg.append("g")
        .attr("class", "ry axis")
        .attr("transform", "translate(" + width + ",0)")
        .call(ryAxis);
    
    svg.append("text")
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + width/2 + "," + (height+1.5*margin.bottom) + ")")
        .text("Year");
    
    svg.append("text")
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-90) translate(" + -height/2 + "," + -0.75*margin.left + ")")
        .text("% Assets");
    
    svg.append("text")
        .style("text-anchor", "middle")
        .attr("transform", "rotate(90) translate(" + height/2 + "," + -(width+0.75*margin.right) + ")")
        .text("$ Investment Needed");
    
    var path_legend = svg.selectAll('.path_legend')
        .data([['projection','green','lightgreen'],['investment','black','gray']])
        .enter().append('g')
        .attr('transform', 'translate('+(width-160)+','+(height+margin.bottom)+')');
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
    
    d3.selectAll("input").on("change", change);
    
    function update_tooltip(d, i) {
        var tooltip_html = '<b>'+d.x+'</b>' + '<br>';
        for (var j in index_mapping) {
            var percent = Math.round(layers[index_mapping[j]][i].y*100)/100;
            tooltip_html += '<i>'+j+'</i>' + ': ' + percent + '%<br>';
        }
        tooltip_html += format_dollars(d.ry);
        $('.ui-tooltip-content').html(tooltip_html);
    }
    
    function change() {
        if (this.value === "grouped") transitionGrouped();
        else transitionStacked();
    }
    
    function transitionGrouped() {
        y.domain([0, yGroupMax]);
        
        rect.transition()
            .duration(500)
            .delay(function(d, i) { return i * 10; })
                .attr("x", function(d, i, j) { return x(d.x) + x.rangeBand() / n * j; })
                .attr("width", x.rangeBand() / n)
            .transition()
                .attr("y", function(d) { return y(d.y); })
                .attr("height", function(d) { return height - y(d.y); });
    }
    
    function transitionStacked() {
        y.domain([0, yStackMax]);
        
        rect.transition()
            .duration(500)
            .delay(function(d, i) { return i * 10; })
                .attr("y", function(d) { return y(d.y0 + d.y); })
                .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
            .transition()
                .attr("x", function(d) { return x(d.x); })
                .attr("width", x.rangeBand());
    }
}