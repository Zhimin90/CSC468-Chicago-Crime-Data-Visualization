var Radialchart = function () {
  var chart = {
    selector: function () {
      let data = [
        { option: "Ward crime count by Hour", value: "hours|ward" },
        { option: "Crime Type by Hour", value: "hours|primary_type" },
        {
          option: "Crime location by Hour",
          value: "hours|location_description",
        },
      ];

      var ctSelector = d3
        .select("div.radialchart")
        .append("select")
        .attr("id", "radialselector")
        .style("position", "absolute")
        .style("z-index", 1000)
        .selectAll("option")
        .data(data)
        .enter()
        .append("option")
        .text(function (d) {
          return d.option;
        })
        .attr("value", function (d, i) {
          return d.value;
        });
    },

    drawRadialChart: function (svg, data) {
      output = document.getElementById("radialselector").value;
      output = output.split("|");

      groupKey1 = output[0];
      groupKey2 = output[1];

      if (groupKey1 == "hours" && groupKey2 == "ward") {
        z = d3
          .scaleOrdinal()
          .range([
            "#98abc5",
            "#8a89a6",
            "#7b6888",
            "#6b486b",
            "#a05d56",
            "#d0743c",
            "#ff8c00",
          ]);
      } else if (groupKey1 == "hours" && groupKey2 == "primary_type") {
        z = d3.scaleOrdinal().range(d3.schemeSet1);
      } else if (groupKey1 == "hours" && groupKey2 == "location_description") {
        z = d3.scaleOrdinal().range(d3.schemeTableau10);
      }

      
      //console.log("radial data length", data.length);

      //data grouping
      dataGrouped = groupBy(data, groupKey1, groupKey2);
     //console.log("group in radial by is", dataGrouped);

      keys = getUnique(data, groupKey2);
      
      crime_total_count = gettotal(data, groupKey1, groupKey2)
     //console.log('crime_total', crime_total_count)
      data = dataGrouped;
     //console.log("data", data);

      (width = +svg.attr("width")),
        (height = +svg.attr("height")),
          (innerRadius = height/3.5), //125
        (outerRadius = Math.min(width, height) * 0.5),
        (g = svg
          .append("g")
          .attr(
            "transform",
            "translate(" + width * 0.4 + "," + height * 0.5 + ")"
          ));

      x = d3
        .scaleBand()
        .range([0, 2 * Math.PI])
        .align(0);

      y = d3.scaleRadial().range([innerRadius, outerRadius]);

      // z = d3.scaleOrdinal()
      //     .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

      x.domain(
        data.map(function (d) {
          //gives the key aka ward number
          //         console.log("x.domina is",d.key)
          return d.key;
        })
      );

      y.domain([0, crime_total_count]); //d3.max(data, function(d) { return d.total; })

      z.domain(keys); //data.columns.slice(1) =keys
      //console.log("what d3.stack().keys(keys)(data) is: , d#1",d3.stack().keys(keys)(data))
     //console.log("data before stacked", data);
      var index = 0;
      stackedData = keys.map((d) => {
        hr = Object.keys(data);
        hr = hr.map((keyhr) => {
          arr = [0, data[keyhr][d]];
          arr.data = data[keyhr];
          return arr;
        });
        hr.index = index;
        hr.key = d;
        return hr;
        index++;
      }); //d3.stack().keys(keys)(data);
     //console.log("stackedData", stackedData);
      stackedData.forEach((layer1) => {
        layer1.forEach((layer2) => {
          layer2.key0 = +layer1.key;
        });
      });

    legend = g
        .append("g")
        .selectAll("g")
        .data(keys.reverse()) //data.columns.slice(1) =keys
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(-270," + (i - (keys.length - 1) / 2) * 20 + ")";
        });

    legend
        .append("rect")
        .attr("width", 19)
        .attr("height", 16)
        .attr("fill", z);

    legend
        .append("text")
        .attr("x", 24)
        .attr("y", 3.5)
        .attr("dy", "0.60em")
        .attr("fill", "white")
        .style("font", "20px times")
        .text(function (d) {
            return d;
        })

      stackedData.forEach((val, shifti) => {
        g_sub = g.append("g");
          
        g_sub.attr("class", "radialPiece");
        g_sub
          .attr("transform", "translate(" + shiftonindex(shifti, 0, 0) +",0)")
          .append("g")
          //.attr("class", "radialPiece")
          //.attr("transform", "translate(" + shifti * 40 + ",0)")
          .selectAll("g")
          .data([val]) //data.columns.slice(1) =keys
          .enter()
          .append("g")
          .attr("fill", function (d) {
            return z(d.key);
          }) //gives the fill color
          .selectAll("path")
          .data(function (d) {
            return d;
          })
          .enter()
          .append("path")
          .attr("id", (d) => "rc".concat(d.key0))
          .attr(
            "d",
            d3
              .arc()
              .innerRadius(function (d) {
                return y(d[0]);
              })
              .outerRadius(function (d) {
                return y(d[1]);
              }) //this gives the path points for the outer radius
              .startAngle(function (d) {
                return x(d.data.key);
              }) //d.data.State = key
              .endAngle(function (d) {
                return x(d.data.key) + x.bandwidth();
              }) //d.data.State = key
              .padAngle(0.01)
              .padRadius(innerRadius)
          )
          .on("mouseover", mouseover)
          .on("mousemove", mousemove)
          .on("mouseleave", mouseleave);

        yAxis = g_sub
          .append("g")
          //.attr("transform", "translate(" + shifti * 40 + ",0)")
          .attr("text-anchor", "end");

        yTick = yAxis
          .selectAll("g")
          .data(y.ticks(3).slice(1)) //changed y.ticks from 10 to 3 to maek legend more clean
          .enter()
          .append("g");

        //console.log("stackedData", stackedData)
        yTick
          .append("circle")
          .attr("fill", "none")
          .attr("stroke", "#FFF")
          .attr("stroke-opacity", 0.25)
          .attr("r", y);

        label = g_sub
          .append("g")
          //.attr("transform", "translate(" + shifti * 40 + ",0)")
          .selectAll("g")
          .data(data)
          .enter()
          .append("g")
          .attr("text-anchor", "middle")
          .attr("transform", function (d) {
            //console.log("d.key is",d.key)
            return (
              "rotate(" +
              (((x(d.key) + x.bandwidth() / 2) * 180) / Math.PI - 90) +
              ")translate(" +
              innerRadius +
              ",0)"
            );
          });

        label.append("line").attr("x2", -5).attr("stroke", "#FFF");

        label
          .append("text")
          .attr("transform", function (d) {
            return (x(d.key) + x.bandwidth() / 2 + Math.PI / 2) %
              (2 * Math.PI) <
              Math.PI
              ? "rotate(90)translate(0,21)"
              : "rotate(-90)translate(0,-9)";
          })
          .text(function(d) {  //changed 24 hour clock to only show odd hours
            if((d.key+1) % 2 != 0){
                return d.key+1; }
            })
          .style("font", "20px times") //the font size of the radial chart
          .style("fill", "white"); //the color of the radial chart

        yTick
          .append("text")
          .attr("x", (d, i) => -i * 5 - 2)
          .attr("y", function (d) {
            return -y(d) + 2;
          })
          .attr("dy", "0.35em")
          .attr("fill", "none")
          .attr("stroke", "#fff")
          .attr("stroke-linejoin", "round")
          .attr("stroke-width", 2)
          .text(y.tickFormat(10, "s"));

        yTick
          .append("text")
          .attr("x", (d, i) => -i * 5 - 2)
          .attr("y", function (d) {
            return -y(d) + 2;
          })
          .attr("dy", "0.35em")
          .text(y.tickFormat(10, "s"));

        /*yAxis.append("text")
                .attr("x", -6)
                .attr("y", function(d) { return -y(y.ticks(10).pop()); })
                .attr("dy", "-1em")
                .text("Population");*/

      }); //forEach End 

      
      svg
        .append("rect")
        .on("mouseenter", mouseenterradial)
        .on("mousemove", mousemoveradial)
        .on("mouseleave", mouseleaveradial)
        .classed("background", true)
        .attr("y", 0)
        .attr("x", 0)
        .attr("height", height)
        .attr("width", width)
        .style("opacity", "0%");
    },
  };

  //-------------Tooltip----------------------
  Tooltip = d3
    .select("#lcdivid")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "lightgrey")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "absolute");

  var ex;
  var ey;

  function mouseenterradial() {
    var ecoordinates = d3.mouse(this);
    ex = ecoordinates[0];
    ey = ecoordinates[1];
   //console.log("Entered Radial here");
  }

  function shiftonindex(i, ex, x) {
    return ((1 / 10) * (i * 500 + (x - ex) * 10 * i) - .3 * (x-ex)).toFixed(2);
  }

  function mouseleaveradial() {

   //console.log("Left Radial");
  }

  function mousemoveradial() {
    //console.log()
    var coordinates = d3.mouse(this);
    var x = coordinates[0];
    var y = coordinates[1];
    let G = document.getElementsByClassName("radialPiece");

    Array.from(G).forEach((radialChart, i) => {
      radialChart.setAttribute(
        "transform",
        `translate(${shiftonindex(i, ex, x)}, 0)`
      );
    });
  }

  function mouseover() {
    Tooltip.style("opacity", 0.8);
    d3.select(this)
      .style("stroke", "yellow")
      .attr("stroke-width", 5)
      .style("opacity", 1);
  }

  // {ASSAULT:41,THEFT:208,MOTOR VEHICLE THEFT:}

  function mousemove(d) {
    total = 0;
    target = d[1];
    keyname = "nothing";
    value = "nothing";

    for (i in d.data) {
      if (i != "key") {
        //console.log("key is ",i + " value is:"+d.data[i])
        total += d.data[i];
        if (total == target) {
          //  console.log("total is",total)
          keyname = i;
          value = d.data[i];
          //  console.log("keyname",keyname)
          //  console.log("value",value)
          break;
        }
      }
    }

    Tooltip.html("Value: " + value)
      .html("<h3>" + keyname + ": " + value + "</h3>")
      .style("left", d3.mouse(this)[0] + 300 + "px")
      .style("top", d3.mouse(this)[1] + 900 + "px");
  }

  function mouseleave() {
    Tooltip.style("opacity", 0);
    d3.select(this).style("stroke", "none");
  }

  //This function takes in flat data
  //and keys to group by
  //returns a grouped object is list
  function groupBy(data, key1, key2) {
    let uniqueKey1s = getUnique(data, key1).sort((a, b) => a - b);
    let uniqueKey2s = getUnique(data, key2);
    //console.log("uniqueKey1s: ", uniqueKey1s)
    //let dict1 = {}
    dict1 = uniqueKey1s.map((val1) => {
      //console.log(val1);
      return { key: val1 };
    });
    //dict1 = dict1.sortBy('key');;
    //console.log("dict1: ", dict1);
    //console.log(dict)

    index = 0;
    uniqueKey1s.forEach((key1Value) => {
      dataOnlykey1 = data.filter((val) => val.properties[key1] === key1Value);
      uniqueKey2s.forEach((key2Value) => {
        listOfValue = dataOnlykey1.filter(
          (val) => val.properties[key2] === key2Value
        );
        count = listOfValue.length;
        if (key1Value === dict1[index].key) {
          dict1[index][key2Value] = count;
        }
      });
      index++;
    });
    //console.log(dict)
    return dict1;
  }

  function getUnique(data, key) {
    //console.log("data in unique", data)
    //console.log("key", key)
    const unique = [...new Set(data.map((item) => item.properties[key]))];
    return unique;
  }

  function gettotal(data, key1, key2) {
      let uniqueKey1s = getUnique(data, key1).sort((a, b) => a - b);
      let uniqueKey2s = getUnique(data, key2);
      //console.log("uniqueKey1s: ", uniqueKey1s)
      //let dict1 = {}
      dict1 = uniqueKey1s.map((val1) => {
          //console.log(val1);
          return { key: val1 };
      });
      //dict1 = dict1.sortBy('key');;
      //console.log("dict1: ", dict1);
      //console.log(dict)
      max = 0
      index = 0;
      uniqueKey1s.forEach((key1Value) => {
          dataOnlykey1 = data.filter((val) => val.properties[key1] === key1Value);
          uniqueKey2s.forEach((key2Value) => {
              listOfValue = dataOnlykey1.filter(
                  (val) => val.properties[key2] === key2Value
              );
              count = listOfValue.length;
              //console.log('count', count)
              if (key1Value === dict1[index].key) {
                  dict1[index][key2Value] = count;
                  if (count > max){ max = count}
              }
          });
          index++;
      });
      //console.log("max: ", max)
      return max;
  }

  //unused function to take the top K keys instead of all them.
  function topKData(data, k) {
    testdata = [];

    test = data;
    keys = [];
    sortable = [];

    for (test of data) {
      for (i in test) {
        if (i != "key") {
          sortable.push([i, test[i]]);
        }
      }

      sortable.sort(function (a, b) {
        return a[1] - b[1];
      });
      sortable = sortable.slice(sortable.length - k, sortable.length - 1);

      sortable.push(["key", test["key"]]);
     //console.log("new sortable is", sortable);

      objSorted = {};
      sortable.forEach(function (item) {
        if (item[0] != "key" && !keys.includes(item[0])) {
         //console.log("the item[0] is", item[0]);
          keys.push(item[0]);
        }
        objSorted[item[0]] = item[1];
      });
     //console.log("keys", keys);
     //console.log("the new sort is ", objSorted);

      data = objSorted;
      testdata.push(objSorted);
    }
    return [testdata, keys];
  }

  return chart;
};

//global function that came inc
(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory(exports, require("d3-scale"))
    : typeof define === "function" && define.amd
    ? define(["exports", "d3-scale"], factory)
    : factory((global.d3 = global.d3 || {}), global.d3);
})(this, function (exports, d3Scale) {
  "use strict";

  function square(x) {
    return x * x;
  }

  function radial() {
    var linear = d3Scale.scaleLinear();

    function scale(x) {
      return Math.sqrt(linear(x));
    }

    scale.domain = function (_) {
      return arguments.length ? (linear.domain(_), scale) : linear.domain();
    };

    scale.nice = function (count) {
      return linear.nice(count), scale;
    };

    scale.range = function (_) {
      return arguments.length
        ? (linear.range(_.map(square)), scale)
        : linear.range().map(Math.sqrt);
    };

    scale.ticks = linear.ticks;
    scale.tickFormat = linear.tickFormat;

    return scale;
  }

  exports.scaleRadial = radial;

  Object.defineProperty(exports, "__esModule", { value: true });
});
