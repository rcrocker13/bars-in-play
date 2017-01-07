var padding = {top: 40, right: 60, bottom: 40, left: 80};
var height = 150;
var width = 200;
var colorScale;

var x = d3.scaleBand()
  .range([0, width])
  .paddingInner(0.1);
var y = d3.scaleLinear()
  .range([height, 0 ]);

var xAxis = d3.axisBottom(x);
var yAxis = d3.axisLeft(y)
  .ticks(4);

var canvas = d3.select("#chart").append("svg")
    .attr("height", height + padding.top + padding.bottom)
    .attr("width", width + padding.left + padding.right)
  .append("g")
    .attr("transform", "translate(" + padding.left + ", " + padding.top + ")");

d3.csv("data/run-gap.csv", function(error, data) {
  if (error) { return console.warn(error); }

  data = data.map(function(d) {
    return {
      runGap: d.runGap,
      count: +d.count,
      avgSuccess: +d.avgSuccess,
      expSuccess: +d.expSuccess
    };
  });

  colorScale = d3.scaleLinear()
    .range([0, 1])
    .domain(d3.extent(data, function(d) {
      return d.avgSuccess;
    }));

  x.domain(data.map(function( d ) {
        return d.runGap;
    }));

  var max = d3.max(data.map(function(d) {
    return d.count;
  }));

  y.domain([0, max])
    .range([height, 0]);

  canvas.append("g")
    .attr("transform", "translate(0, " + height + ")")
    .call(xAxis);

  canvas.append("g")
    .call(yAxis);

  var bar = canvas.selectAll(".bar")
    .data(data);

  bar.enter()
    .append("rect")
    // class our rects to .bar so the selection can find their target
    .attr("class", "bar")
    .attr("fill", function(d) {
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

})
