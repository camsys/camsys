Demo
====
http://web.mit.edu/lu16j/www/camsys/visuals.html

Usage
=====
Configure functions/data_loader.js to load data into the schema specified in the file.  
Configure default values and metric functions (detailed below) in setup.js.

Area Bar Chart Visualization
============================
* Black vertical bar: divides historical (left) and projected (right) data.
* Black pointer: indicates the year currently being displayed in the Sunburst visualization.

Left Y-Axis (weighted % of assets)
----------------------------------
* Colored bars: represent percentage of assets in each type of condition.
* Green trendline: a linear regression on the historical percentages of "good" assets.
* Water table threshold line: the "goal", a user-defined threshold for being in "good repair".

Right Y-Axis ($ invested)
-------------------------
* Black curve: shows the amount invested in past years, and the amount projected to be invested in future years.

Sunburst Visualization
======================
Breakdown of investment in any given year
-----------------------------------------
Each layer outward displays the data in a finer grain. Unzoomed, this corresponds to:
* Center: total investment in (year).
* 1st ring: percentage of total divided into each class of asset (vehicle, etc.).
* 2nd ring: percentage of class divided into each type of asset (vehicle -> bus, light rail, etc.).
* 3rd ring: percentage of type divided into each individual asset.

Clicking on any segment in a layer will zoom into the segment, with itself expanding to occupy the entire 360 degrees and its sub-divisions in the next layer expanding accordingly. Clicking on the small circle in the center will zoom back out into the previous layer.  
Zooming in on a segment will also re-scale the Area Bar Chart to display percentages and investment for the selected sub-group only.  
Clicking on the list icon in the upper right reveals a heirarchical legend. Clicking on these items corresponds to clicking on segments in the Sunburst chart.

Calculator
==========
* Click the "Show Calculator" button to reveal.
* Enter either field to calculate the result in the other.
* Ex. Enter "20000000" (20 million) in the first field to get the year backlog will be cleared in the second field.

Default Metrics (in functions/setup.js)
=======================================
* Area Bar Chart
  * area_bar_metric
    * Weights each asset LINEARLY with its PRICE and LOGARITHMICALLY with its USAGE, so expensive and highly-used (by commuters) assets are weighted the highest. Usage is currently made-up data loosely related to number of commuters served per day.
  * area_bar_comparator
    * Sorts the yearly replacement priority queue by each asset's RATE OF DECAY, or the slope of its TERM curve at the given year; faster-decaying assets are queued higher up.
  * queue order
    * In models/System.js:
      * var queue = marginal_queue.concat(backlog_queue).concat(bad_queue);
    * Modify the above line of code to change the yearly replacement queue order. As is, the queue order is bad-backlog-marginal (assets needing replacement this year are replaced first, followed by backlog...)
* Sunburst
  * sunburst_metric: arc angle is proportional to the actual amount invested in each asset at any given year (previously was the amount of investment needed to bring each asset back into good repair).

Current To-dos
==============
Directly read in historical data from the data schema in functions/data_loader.js. Historical data currently generated; rewrite generating function to add in past replacement years for each asset.
