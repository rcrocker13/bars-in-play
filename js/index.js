var rungaps = d3.scaleOrdinal()
        .domain(["LD", "LC", "LB", "LA/RA", "RB", "RC", "RD"])
        .range(["7", "5", "3", "1/2", "4", "6", "8"])
        .unknown(null)
  , colorExtents = {
          avgSuccess: []
        , expSuccess: []
      }
  , colorScale = d3.scaleLinear()
  , chartRungap = BarChart().xdomain(rungaps.range())
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

    function success_resid(l) { return l.success_resid; }
    function expected_resid(l) { return l.expected_resid; }

    colorExtents.avgSuccess = d3.extent(data, success_resid);
    colorExtents.expSuccess = d3.extent(data, expected_resid);

    // arrange the data in a hierarchy by:
    var opponents = d3.nest()
        // Opposing team name
        .key(function(d) { return d.Defense; })
        // Run direction
        // Populate with only the data we need
        .rollup(function(leaves) {
              return {
                  rundirs: d3.nest()
                      .key(function(d) { return d.RunDir; })
                      .rollup(function(leaves) {
                          return {
                              count: leaves.length
                            , avgSuccess: d3.mean(leaves, success_resid)
                            , expSuccess: d3.mean(leaves, expected_resid)
                            , plays: leaves
                          };
                        })
                      .map(leaves)
                , reads: d3.nest()
                      .key(function(d) { return d.PostRead1; })
                      .rollup(function(leaves) {
                          return {
                              count: leaves.length
                            , avgSuccess: d3.mean(leaves, success_resid)
                            , expSuccess: d3.mean(leaves, expected_resid)
                            , plays: leaves
                          };
                        })
                      .map(leaves)
              };
          })
        // But first, filter dataset of nulls, "Trick Play"s, etc
        .map(data.filter(function(d) { return rungaps(d.RunDir); }))
    ;
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
        .on("change", function() { update(opponents.get(this.value).rundirs); })
    ;
    d3.select("#color")
        .on("change", function() { update_colors(this.value); })
    ;
    /*
    ** Set up the initial svg
    */
    d3.select("#chart-rungap")
        .call(chartRungap)
    ;
    /*
    ** Initialize the visualization
    */
    update(opponents.get(d3.select("#opponent").node().value).rundirs);
    console.log(data, opponents);
} // main_function()

function update(data) {
    var selectedColor = d3.select("#color").node().value;
    colorScale.domain(colorExtents[selectedColor]);
    chartRungap
        .data(data)
        .update()
    ;
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
