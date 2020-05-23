var Linechart = function(){
    var chart = {
        drawChart : function(svg, svgdata){
          var wardGroup = parseData(svgdata)
          var maxCount = findMaxCount(wardGroup) 
          var maxMonth = findMaxMonth(wardGroup)
          var tick = parseInt(maxMonth.getMonth().toString()) +1

          var margin = {top: 10, right: 30, bottom: 30, left: 60},
          width = +d3.select("svg.linechart").attr("width") - margin.left - margin.right,
          height = +d3.select("svg.linechart").attr("height") - margin.top - margin.bottom;

          var myColor = d3.scaleSequential().domain([1,50])
                           .interpolator(d3.interpolateTurbo);

          var Tooltip = d3.select("#my_dataviz")
                           .append("div")
                           .style("opacity", 0)
                           .attr("class", "tooltip")
                           .style("background-color", "white")
                           .style("border", "solid")
                           .style("border-width", "2px")
                           .style("border-radius", "5px")
                           .style("padding", "5px")

          var mouseover = function(d) {
                            Tooltip
                              .html("text here ", 1)
                              .style("left", (d3.mouse(this)[0]+70) + "px")
                              .style("top", (d3.mouse(this)[1]) + "px")
                          }

          var x = d3.scaleTime()
                    .domain([new Date("01"), maxMonth])
                    .range([ 0, width ]);
          
          var y = d3.scaleLinear()
                .domain([0, maxCount +100])
                .range([ height, 0 ]);

          svg = svg.append("g")
                   .attr("transform","translate(" + margin.left + "," + margin.top + ")");

          if(svgdata.length > 0){
            svg.append("g")
                .attr("class", "axisWhite")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).ticks(tick).tickFormat(d3.timeFormat("%b")));

            svg.append("g")
                .attr("class", "axisWhite")
                .call(d3.axisLeft(y));
          }

          wardGroup.forEach(function(da) {
              svg.append("path")
              .data([da.data])  
              .attr("fill", "none")
              .attr("stroke", myColor(da.key))
              .attr("stroke-width", 1.5)
              .attr("d", d3.line()
                .x(function(d) { return x(d.date) })
                .y(function(d) { return y(d.value) })
                )
              .on("mouseover", mouseover)
            }) 
        }//drawChart
    }//chart

    function parseWard(svgdata){
      var wardData = [];
      var groupedData = d3.nest().key(function(d) {return new Date(d.properties.date).getMonth();}).entries(svgdata);
      for (var g of groupedData){
        var k = parseInt(g.key)+1;
        var count = g.values.length;
        var month = new Date(k.toString());
        wardData.push({date:month, value:count})
      }
      return wardData;
    }//toLineChartDate

    function parseData(svgdata){
      var groupedWard = d3.nest().key(function(d) {return d.properties.ward;}).entries(svgdata);     
      var retList = [];
      for(w of groupedWard){
        retList.push({key:w.key, data:parseWard(w.values)})
      }
      return retList;
    }//parseDate

    function findMaxCount(wardGroup){
      var max = 0;
      for(ward of wardGroup){
        for(w of ward.data){
          if(w.value > max){
            max = w.value
          }
        }
      }
      return max;
    }//findMaxCount

    function findMaxMonth(wardGroup){
      var max = new Date("01");
      console.log(wardGroup)
      for(ward of wardGroup){
        for(w of ward.data){
          if(w.date > max){
            max = w.date
          }
        }
      }
      return max;
    }//findMaxMonth

    return chart;
}