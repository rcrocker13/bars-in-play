var selectedOption = "avgSuccess";
var colorExtent = [];
var captureOption;

captureOption = function() {
  selectedOption = document
    .getElementById("color")
    .options[document.getElementById("color").selectedIndex]
    .value;

  console.log("Ran");

  d3.csv("data/run-gap.csv", function(error, data) {
    if (error) { return console.warn(error); }

    colorExtent = d3.extent(data.map(function(d) {
      return d[selectedOption];
    }));

    console.log(colorExtent);

    colorScale = d3.scaleLinear()
      .range([0, 1])
      .domain(colorExtent);
  })

  d3.selectAll("rect")
    .attr("fill", function(d) {
      return d3.interpolateWarm(colorScale(d[selectedOption]));
    })
  return selectedOption;
}
