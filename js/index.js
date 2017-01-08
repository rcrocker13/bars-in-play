var padding = {top: 40, right: 60, bottom: 40, left: 80}
  , height = 150
  , width = 200
  , rungaps = d3.scaleOrdinal()
        .domain(["LD", "LC", "LB", "LA/RA", "RB", "RC", "RD"])
        .range(["7", "5", "3", "1/2", "4", "6", "8"])
        .unknown(null)
  , x = d3.scaleBand()
        .domain(rungaps.range())
        .range([0, width])
        .paddingInner(0.1)
  , y = d3.scaleLinear()
        .range([height, 0 ])
  , xAxis = d3.axisBottom(x)
  , yAxis = d3.axisLeft(y)
        .ticks(4)
  , colorExtents = {
          avgSuccess: []
        , expSuccess: []
      }
  , colorScale = d3.scaleLinear()
;
var canvas = d3.select("#chart").append("svg")
    .attr("height", height + padding.top + padding.bottom)
    .attr("width", width + padding.left + padding.right)
  .append("g")
    .attr("transform", "translate(" + padding.left + ", " + padding.top + ")")
;


d3.queue()
    .defer(d3.csv, "data/og-data.csv", preprocess)
    .await(main_function)
;

function preprocess(row) {
    var success = row["Success?"] === "Yes" ? 1 : 0;

    row.success_resid  = success - 0.432;
    row.expected_resid = success - row.ExpectedEP;

    // MUST do this!
    return row;
} // preprocess()

function main_function(error, data) {
    if (error) throw error;

    colorExtents.avgSuccess = d3.extent(data, function(d) { return d.success_resid; });
    colorExtents.expSuccess = d3.extent(data, function(d) { return d.expected_resid; });

    // arrange the data in a hierarchy by:
    var opponents = d3.nest()
        // Opposing team name
        .key(function(d) { return d.Defense; })
        // Run direction
        .key(function(d) { return d.RunDir; })
        // Populate with only the data we need
        .rollup(function(leaves) {
            return {
                count: leaves.length
              , avgSuccess: d3.mean(leaves, function(l) { return l.success_resid; })
              , expSuccess: d3.mean(leaves, function(l) { return l.expected_resid; })
            };
          })
        // But first, filter dataset of nulls, "Trick Play"s, etc
        .map(data.filter(function(d) { return rungaps(d.RunDir); }))
    ;
    console.log(opponents);
    // Populate the select box with the team name
    var opt = d3.select("#opponent")
        .append("optgroup") //enhance UX
          .attr("label", "Select Opponent")
      .selectAll("option")
        .data(opponents.keys(), function(d) { return d; })
    ;
    opt.enter()
      .append("option")
        .text(function(d) { return d; })
    ;
    d3.select("#opponent")
        .on("change", function() {
            update(opponents.get(this.value));
          })
    ;
    d3.select("#color")
        .on("change", function() {
            update_colors(this.value);
          })
    ;
    /*
    ** Set up the initial axes
    */
    canvas.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis.scale(x)) // this axis won't change
    ;
    canvas.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis)
    ;

    /*
    ** Initialize the visualization
    */
    update(opponents.get(d3.select("#opponent").node().value));
  } // main_function()

function update(data) {
    console.log(data);
    var selectedColor = d3.select("#color").node().value;
    colorScale.domain(colorExtents[selectedColor]);

    var max = d3.max(data.values(), function(d) { return d.count; });
    y
        .domain([0, max])
    ;
    var bar = canvas.selectAll(".bar")
        .data(data.entries(), function(d) { return d.key; })
    ;
    bar.enter()
      .append("rect")
        // class our rects to .bar so the selection can find their target
        .attr("class", "bar")
        // .style("fill", function(d) {
        //     return d3.interpolateWarm(colorScale(d[selectedOption]));
        //   })
        .attr("x", function(d, i) {
            return x(rungaps(d.key));
          })
        .attr("width", x.bandwidth())
        .attr("y", function(d) {
            return y(0);
          })
        .attr("height", 0)
      .merge(bar)
      .transition()
        .attr("y", function(d) {
            return y(d.value.count);
          })
        .attr("height", function(d) {
            return height - y(d.value.count);
          })
        .style("fill", function(d) {
            return d3.interpolateWarm(colorScale(d.value.avgSuccess));
          })
    ;
    d3.select(".axis--y")
      .transition()
        .call(yAxis.scale(y))
    ;
    d3.select(".axis--x")
      .transition()
        .call(xAxis.scale(x))
    ;
    bar.exit()
      .transition()
        .attr("y", y(0))
        .attr("height", 0)
    ;
    //update_colors(d3.select("#color").node().value);
} // update()

function update_colors(selectedOption) {
    colorScale.domain(colorExtents[selectedOption]);

    d3.selectAll("rect")
      .transition()
        .style("fill", function(d) {
            return d3.interpolateWarm(colorScale(d.value[selectedOption]));
          })

    ;
} // update_colors()xf
