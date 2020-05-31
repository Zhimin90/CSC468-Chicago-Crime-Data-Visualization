var Linechart = function(){
    var chart = {
        drawChart : function(svg, svgdata){
          var wardGroup = parseData(svgdata)
          var maxCount = findMaxCount(wardGroup) 
          var maxMonth = findMaxMonth(wardGroup)
          var tick = parseInt(maxMonth.getMonth().toString()) +1

          // var margin = {top: 10, right: 30, bottom: 30, left: 60},
          var margin = {top: 20, right: 10, bottom: 30, left: 40},
          width = +d3.select("svg.linechart").attr("width") - margin.left - margin.right,
          height = +d3.select("svg.linechart").attr("height") - margin.top - margin.bottom;

          var myColor = d3.scaleSequential().domain([1,50])
                           .interpolator(d3.interpolateTurbo);

          var x = d3.scaleTime()
                    .domain([new Date("01"), maxMonth])
                    .range([ 0, width ]);
          
          var y = d3.scaleLinear()
                .domain([0, maxCount])
                .range([ height, 0 ]);

          function make_y_gridlines() {		
            return d3.axisLeft(y)
                .ticks(5)
          }

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

            svg.append("g")			
               .attr("class", "axisWhite")
               .style("opacity", 0.3)
                .call(make_y_gridlines()
                    .tickSize(-width)
                    .tickFormat("")
                )
          }

          wardGroup.forEach(function(da , i) {
              svg.append("path")
              .data([da.data])  
              // .attr("id", da.key)
              .attr("id", "lc".concat(da.key))
              .attr("fill", "none")
              .attr("stroke", myColor(da.key))
              .attr("stroke-width", 3.5)
              .attr("d", d3.line()
                .x(function(d) { return x(d.date) })
                .y(function(d) { return y(d.value) })
                )
              .on("mouseover", mouseover)
              .on("mousemove", mousemove)
              .on("mouseleave", mouseleave)

              //legend side
              svg.selectAll("lineLabels")
                  .data([da.data])
                  .enter()
                  .append('g')
                  .append("text")
                    .attr("transform", function(d) { return "translate(" + x(d[0].date) + "," + y(d[0].value)  + ")"; }) 
                    .attr("x", 12) // shift the text a bit more right
                    .text("Ward "+ da.key)
                    .style("fill", function(d){ return myColor(da.key) })
                    .style("font-size", 20)

              //legend top
              // svg
              // .selectAll("lineLegend")
              // .data([da.data])
              // .enter()
              //   .append('g')
              //   .append("text")
              //     .attr('x', function(d){ return 10 + i*30})
              //     .attr('y', 0)
              //     .text(function(d) { return da.key; })
              //     .style("fill", function(d){ return myColor(da.key) })
              //     .style("font-size", 20)
            }) 

        }//drawChart
    }//chart

    // var Tooltip = d3.select("#lcdivid")
    var Tooltip = d3.select("body")
                    .append("div")
                    .style("opacity", 0)
                    .attr("class", "tooltip")
                    .style("background-color", "lightgrey")
                    .style("border", "solid")
                    .style("border-width", "2px")
                    .style("border-radius", "5px")
                    .style("padding", "5px")
                    .style("position", "absolute")

    function mouseover(){
        Tooltip
          .style("opacity", 0.8)
        d3.select(this)
          .style("stroke-width", 8)
          .style("opacity", 1)
      }

    function mousemove(d){

        var ward = d3.select(this).attr("id").replace("lc","");
        Tooltip
          .html("<h3>Ward: " + ward + "</h3>" + getToolTipInfo(d)) //getToolTipInfo(d)
          .style("left", (d3.mouse(this)[0]+800) + "px")
          .style("top", (d3.mouse(this)[1]+450) + "px")
      }

    function mouseleave(){
        Tooltip
          .style("opacity", 0)
        d3.select(this)
        .style("stroke-width", 3.5)
          .style("opacity", 1)
      }




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
      for(ward of wardGroup){
        for(w of ward.data){
          if(w.date > max){
            max = w.date
          }
        }
      }
      return max;
    }//findMaxMonth

    function getToolTipInfo(ward){
      sortedWard = ward.slice().sort((a,b) => d3.ascending(a.date, b.date));
      var rts = "";
      for(w of sortedWard){
        rts = rts + "<h5 style=text-align:center;>" + d3.timeFormat("%b")(w.date) + ": " + w.value + "</h5>";
      }
      return rts;
    }//getToolTipInfo

    return chart;
}