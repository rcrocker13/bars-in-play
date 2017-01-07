function BarChart() {
    /*
    ** Private Variables
    */
    var svg
      , margin
      , data
      , title
    ;
    /*
    ** Main Function Object
    */
    function my(sel) {
        title = title || "barchart" + Math.round(Math.random() * 10000);
        svg = sel.selectAll("svg")
            .data([title], function(d) { return d; })
        ;
        svg.enter()
          .append("svg")
            .style("width",  "100%")
            .style("height", "100%")
          .append("title")
            .text(title)
        ;
        console.log(svg)
    } // main function object

    /*
    ** Private Helper Functions
    */

    /*
    ** API: Getter/Setter Functions
    */
    my.title = function(_) {
        if(!arguments.length) return title;
        title = _;
        return my;
      } // my.title()
    ;

    // This is ALWAYS the last thing returned
    return my;
} // function object BarChart()
