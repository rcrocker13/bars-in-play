var rungaps = d3.scaleOrdinal()
        .domain(["LD", "LC", "LB", "LA/RA", "RB", "RC", "RD"])
        .range(["7", "5", "3", "1/2", "4", "6", "8"])
        .unknown(null)
  , colorExtents = {
          avgSuccess: []
        , expSuccess: []
      }
  , colorScale = d3.scaleLinear()
  , signal = d3.dispatch("rungaps", "reads")
  , chartRungap = BarChart().title("rungaps").connect(signal)
  , chartReads = BarChart().title("reads").connect(signal)
  , filters = {
          rungaps: null
        , reads: null
      }
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

    colorExtents.avgSuccess = d3.extent(data, success_resid);
    colorExtents.expSuccess = d3.extent(data, expected_resid);

    // arrange the data in a hierarchy by:
    var opponents = d3.nest()
        // Opposing team name
        .key(function(d) { return d.Defense; })
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
        .on("change", function() {
            update(opponents.get(this.value));
          })
    ;
    d3.select("#color")
        .on("change", function() { update_colors(this.value); })
    ;
    /*
    ** Set up the initial svg
    */
    d3.select("#chart-rungap")
        .call(chartRungap.xdomain(rungaps.range()).labeller(rungaps))
    ;
    d3.select("#chart-reads")
        .call(chartReads.labeller(function(d) { return d || "None"; }))
    ;
    /*
    ** Initialize the visualization
    */
    update(opponents.get(d3.select("#opponent").node().value));

    signal
        .on("rungaps", function(arg) {
            filters.rungaps = filters.rungaps === arg ? null : arg;

            chartReads
                .data(readsify(opponents.get(d3.select("#opponent").node().value)))
                .update()
            ;
          })
        .on("reads", function(arg) { console.log(arg); })
} // main_function()


function success_resid(l) { return l.success_resid; }
function expected_resid(l) { return l.expected_resid; }

function nestify(key) {
    return d3.nest()
        .key(key)
        .rollup(function(leaves) {
            return {
                count: leaves.length
              , avgSuccess: d3.mean(leaves, success_resid)
              , expSuccess: d3.mean(leaves, expected_resid)
              , plays: leaves
            };
          })
    ;
} // nestify()

function rundirsify(data) {
    return nestify(function(d) { return d.RunDir; })
        .map(data.filter(function(d) { return filters.reads ? d.PostReads === filters.reads : true; }))
    ;
} // rundirsify()

function readsify(data) {
    return nestify(function(d) { return d.PostRead1; })
        .map(data.filter(function(d) { return filters.rungaps ? d.RunDir === filters.rungaps : true; }))
    ;
} // readsify()

function update(data) {
    var selectedColor = d3.select("#color").node().value;
    colorScale.domain(colorExtents[selectedColor]);
    chartRungap
        .data(rundirsify(data))
        .update()
    ;
    chartReads
        .data(readsify(data))
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
