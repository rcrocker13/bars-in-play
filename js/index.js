var padding = {top: 40, right: 60, bottom: 40, left: 80}
  , height = 150
  , width = 200
  , colorScale = d3.scaleLinear()
  , x = d3.scaleBand()
        .range([0, width])
        .paddingInner(0.1)
  , y = d3.scaleLinear()
        .range([height, 0 ])
  , xAxis = d3.axisBottom(x)
  , yAxis = d3.axisLeft(y)
        .ticks(4)
  , rungaps = d3.scaleOrdinal()
        .domain(["LD", "LC", "LB", "LA/RA", "RB", "RC", "RD"])
        .range(["7", "5", "3", "1/2", "4", "6", "8"])
        .unknown(null)
  , colorExtents = {
          average: []
        , expected: []
      }
;

var canvas = d3.select("#chart").append("svg")
    .attr("height", height + padding.top + padding.bottom)
    .attr("width", width + padding.left + padding.right)
  .append("g")
    .attr("transform", "translate(" + padding.left + ", " + padding.top + ")");

d3.queue()
    .defer(d3.csv, "data/og-data.csv", preprocess)
    .await(main_function)
;

function preprocess(row) {
  row.success = row["Success?"] === "Yes" ? 1 : 0;

  row.success_resid  = row.success - 0.432;
  row.expected_resid = row.success - row.ExpectedEP;

  // MUST do this!
  return row;
} // preprocess()

function main_function(error, data) {
    if (error) throw error;

    // arrange the data in a hierarchy by:
    var opponents = d3.nest()
        // Opposing team name
        .key(function(d) { return d.Defense; })
        // Run direction
        .key(function(d) { return d.RunDir; })
        // First, filter dataset of nulls, "Trick Play"s, etc
        .map(data.filter(function(d) { return rungaps(d.RunDir); }))
    ;
    console.log(data, opponents);

    // Populate the select box with the team name
    var opt = d3.select("#opponent")
        .append("optgroup")
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
            update_data(opponents.get(this.value));
          })
    ;
    var selectedOption
      , colorExtent = []
    ;
    d3.select("#color")
        .on("change", function() {
            selectedOption = this.value;
            colorExtent = d3.extent(data, function(d) {
                return d[selectedOption];
              })
            ;
            colorScale
                .domain(colorExtent)
            ;
            d3.selectAll("rect")
                .style("fill", function(d) {
                    return d3.interpolateWarm(colorScale(d[selectedOption]));
                  })

          })
    ;
    /*
    ** Set up the initial axes
    */
    canvas.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis)
    ;
    canvas.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis)
    ;

    /*
    ** Initialize the visualization
    */
    update_data(opponents.get(d3.select("#opponent").node().value));
  } // main_function()

function update_data(data) {
    console.log(data);
    colorScale
        .range([0, 1])
        .domain(d3.extent(d3.merge(data.values()), function(d) { return d.success_resid; }))
    ;
    x
        .domain(rungaps.range())
    ;

    var max = d3.max(data.values().map(function(d) { return d.length; }));
    y
        .domain([0, max])
    ;
    var bar = canvas.selectAll(".bar")
        .data(data.entries(), function(d) { return d.key; })
    ;
    bar = bar.enter()
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
    ;
    bar
      .transition()
        .attr("y", function(d) {
            return y(d.value.length);
          })
        .attr("height", function(d) {
            return height - y(d.value.length);
          })
    ;
    d3.select(".axis--x")
      .transition()
        .call(xAxis.scale(x))
    ;
    d3.select(".axis--y")
      .transition()
        .call(yAxis.scale(y))
    ;
    bar.exit()
      .transition()
        .attr("height", 0)
    ;
} // update_data()
