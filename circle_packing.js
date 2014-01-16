var w = 1280,
    h = 800,
    r = 720,
    x = d3.scale.linear().range([0, r]),
    y = d3.scale.linear().range([0, r]),
    node,
    root;

var pack = d3.layout.pack()
    .size([r, r])
    .value(function(d) { return d.size; })

var vis = d3.select("body").insert("svg:svg", "h2")
    .attr("width", w)
    .attr("height", h)
  .append("svg:g")
    .attr("transform", "translate(" + (w - r) / 2 + "," + (h - r) / 2 + ")");

// https://googledrive.com/host/0B4-zQkdH4geETGcwRGRELTctdVk/flare.json
d3.csv("https://googledrive.com/host/0B4-zQkdH4geETGcwRGRELTctdVk/CAT_Fixed_Route_Vehicle_Inventory.csv", function(csv) {
    csv = CSV(csv);
    var year = 2015;
    var data = csv.format.flare(function (asset) {
        return SGR.replacement_cost(asset.Type, year-asset.Year, asset['purchase price']);
    }, true);
    
  node = root = data;
    
  var nodes = pack.nodes(root);

  vis.selectAll("circle")
      .data(nodes)
    .enter().append("svg:circle")
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return d.r; })
      .on("click", function(d) { return zoom(node == d ? root : d); });

  vis.selectAll("text")
      .data(nodes)
    .enter().append("svg:text")
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("opacity", function(d) { return d.r > 40 ? 1 : 0; })
      .text(function(d) { return d.name; })
  .append("svg:title").text(function (d) { return format_dollars(d.value); });

  d3.select(window).on("click", function() { zoom(root); });
});

function zoom(d, i) {
  var k = r / d.r / 2;
  x.domain([d.x - d.r, d.x + d.r]);
  y.domain([d.y - d.r, d.y + d.r]);

  var t = vis.transition()
      .duration(d3.event.altKey ? 7500 : 750);

  t.selectAll("circle")
      .attr("cx", function(d) { return x(d.x); })
      .attr("cy", function(d) { return y(d.y); })
      .attr("r", function(d) { return k * d.r; });

  t.selectAll("text")
      .attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return y(d.y); })
      .style("opacity", function(d) { return k * d.r > 40 ? 1 : 0; });

  node = d;
  d3.event.stopPropagation();
}

function transition_test(year) {
    for (var i in root.children) {
        var parent = root.children[i];
        for (var j in parent.children) {
            var child = parent.children[j];
            child.size = TERM(parent.name)(year-child.year);
            child.value = child.size;
        }
    }

  nodes = pack.nodes(root);

  vis.selectAll("circle")
      .data(nodes)
  .transition()
  .duration(500)
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return d.r; });

  vis.selectAll("text")
      .data(nodes)
  .transition()
  .duration(500)
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("dy", ".35em")
      .attr('title', function (d) { return d.value; });
}