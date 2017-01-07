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
;

var canvas = d3.select("#chart").append("svg")
    .attr("height", height + padding.top + padding.bottom)
    .attr("width", width + padding.left + padding.right)
  .append("g")
    .attr("transform", "translate(" + padding.left + ", " + padding.top + ")");

d3.queue()
    .defer(d3.csv, "data/run-gap.csv", preprocess)
    .defer(d3.csv, "data/og-data.csv")
    .await(main_function)
;

function preprocess(row) {
    row.count = +row.count;
    row.avgSuccess = +row.avgSuccess;
    row.expSuccess = +row.expSuccess;
    return row;
}

function main_function(error, data, og) {
    if (error) throw error;

    console.log(og);
    // arrange the data in a hierarchy by:
    var opponents = d3.nest()
        // Opposing team name
        .key(function(d) { return d.Defense; })
        // Run direction
        .key(function(d) { return d.RunDir; })
        // Filter dataset of nulls, "Trick Play"s & "Wide Receiver <something>"s
        .map(og.filter(function(d) { return rungaps(d.RunDir); }))
    ;
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
            console.log(opponents.get(this.value).entries());
          })
    ;
    colorScale
        .range([0, 1])
        .domain(d3.extent(data, function(d) { return d.avgSuccess; }))
    ;
    x
        .domain(data.map(function(d) { return d.runGap; }))
    ;

    var max = d3.max(data, function(d) { return d.count; });
    y
        .domain([0, max])
        .range([height, 0])
    ;
    canvas.append("g")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis)
    ;
    canvas.append("g")
        .call(yAxis)
    ;
    var bar = canvas.selectAll(".bar")
        .data(data)
    ;

    bar.enter()
      .append("rect")
        // class our rects to .bar so the selection can find their target
        .attr("class", "bar")
        .style("fill", function(d) {
            return d3.interpolateWarm(colorScale(d[selectedOption]));
          })
        .attr("x", function(d, i) {
            return i * x.step();
          })
        .attr("width", x.bandwidth())
        .attr("y", function(d) {
            return y(d.count);
          })
        .attr("height", function(d) {
            return height - y(d.count);
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
} // main_function()
