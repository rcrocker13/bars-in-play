function BarChart() {
    /*
    ** Private Variables
    */
    var canvas
      , margin
      , data
      , title
      , padding = {top: 40, right: 60, bottom: 40, left: 80}
      , height = 200
      , width = 200
      , x = d3.scaleBand()
            .range([0, width])
            .paddingInner(0.1)
      , y = d3.scaleLinear()
            .range([height, 0 ])
      , xAxis = d3.axisBottom(x)
      , yAxis = d3.axisLeft(y)
    ;
    /*
    ** Main Function Object
    */
    function my(sel) {
        title = title || "barchart" + Math.round(Math.random() * 10000);
        var svg = sel.selectAll("svg")
            .data([1], function(d) { return d; })
        ;
        svg = svg.enter()
          .append("svg")
            .style("width",  "100%")
            .style("height", "100%")
            .attr("height", height + padding.top + padding.bottom)
            .attr("width", width + padding.left + padding.right)
          .each(function(d) {
              d3.select(this)
                .append("title")
                  .text(title)
              ;
            })
          .merge(svg)
        ;
        canvas = svg
          .append("g")
            .attr("transform", "translate(" + padding.left + ", " + padding.top + ")")
        ;
        canvas.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0, " + height + ")")
            .call(xAxis.scale(x)) // this axis won't change
        ;
        canvas.append("g")
            .attr("class", "axis axis--y")
            .call(yAxis)
        ;
    } // main function object

    /*
    ** Private Helper Functions
    */
    function update() {
        var bar = canvas.selectAll(".bar")
            .data(data.entries(), function(d) { return d.key; })
        ;
        bar.enter()
          .append("rect")
            // class our rects to .bar so the selection can find their target
            .attr("class", "bar")
            .attr("x", function(d, i) {
                return x(rungaps(d.key));
              })
            .attr("width", x.bandwidth())
            .attr("y", function(d) { return y(0); })
            .attr("height", 0)
          .merge(bar)
          .transition()
            .attr("y", function(d) { return y(d.value.count); })
            .attr("height", function(d) { return height - y(d.value.count); })
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
    }

    /*
    ** API: Getter/Setter Functions
    */
    my.title = function(_) {
        if(!arguments.length) return title;
        title = _;
        return my;
      } // my.title()
    ;
    my.xdomain = function(_) {
        if(!arguments.length) return x.domain();
        x.domain(_);
        return my;
      } // my.xdomain()
    ;
    my.data = function(_) {
        if(!arguments.length) return data;
        data = _;
        var max = d3.max(data.values(), function(d) { return d.count; });
        y
            .domain([0, max])
        ;
        return my;
      } // my.data()
    ;
    my.update = function(_) {
        update();
        return my;
     } // my.update()
    ;
    // This is ALWAYS the last thing returned
    return my;
} // function object BarChart()
