var Radialchart = function(){
    var chart = {
        selector: function () {

            let data = [{ option: "Ward crime count by Hour", value: "hours|ward" }
                , { option: "Crime Type by Hour", value: "hours|primary_type" }
                , { option: "Crime location by Hour", value: "hours|location_description" }
                , ]

            var ctSelector = d3.select("div.radialchart")
                .append("select")
                .attr("id", "radialselector")
                .style("position", "absolute")
                .style("z-index", 1000)
                .selectAll("option")
                .data(data)
                .enter().append("option")
                .text(function (d) { return d.option; })
                .attr("value", function (d, i) {
                    return d.value;
                });

        },
        
        drawRadialChart : function(svg, data){

            output = document.getElementById('radialselector').value
            output = output.split('|')

            groupKey1 = output[0]
            groupKey2 = output[1]

            crime_total_count = gettotal(data, groupKey1)
            console.log("radial data length", data.length)

            //data grouping
            dataGrouped = groupBy(data, groupKey1, groupKey2)
            console.log("group in radial by is",dataGrouped)

            keys = getUnique(data, groupKey2)

            data = dataGrouped

            // ----- unused since we want all of keys, not just top k keys.
   /*         results=topKData(dataGrouped,10)
            data=results[0]
            keys=results[1]  //this gives us the index keys, i.e. the primary_types, etc
 */         /*
            for (i of keys){
            console.log("the new key is ",i)
            }
            // --------
            console.log("Grouped Data: ", data)*/

            

            width = +svg.attr("width"),
            height = +svg.attr("height"),
            innerRadius = 150,
            outerRadius = Math.min(width, height) * 0.5,
            g = svg.append("g")
            .attr("transform", "translate(" + width*.4+ "," + height * .5 + ")")


            x = d3.scaleBand()
                .range([0, 2 * Math.PI])
                .align(0);
            
            y = d3.scaleRadial()
                .range([innerRadius, outerRadius]);
            
            z = d3.scaleOrdinal()
                .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
                
            x.domain(data.map(function(d) {  //gives the key aka ward number
       //         console.log("x.domina is",d.key)
                return d.key; })); 
            
            y.domain([0, crime_total_count  ]);//d3.max(data, function(d) { return d.total; })

            z.domain(keys); //data.columns.slice(1) =keys
            //console.log("what d3.stack().keys(keys)(data) is: , d#1",d3.stack().keys(keys)(data)) 
      
            g.append("g")
                .selectAll("g")
                .data(d3.stack().keys(keys)(data)) //data.columns.slice(1) =keys
                .enter().append("g")
                .attr("fill", function(d) { 
                    //console.log("z(d.key)",z(d.key))
                    return z(d.key); }) //gives the fill color
                .selectAll("path")
                .data(function(d) { 
              //      console.log("d # 2 is",d)
              //      console.log("d key is",d.key) //returns the crime type
              //      console.log("d value is",d[0].data[d.key]) //returns the value for crime type
                    //var newKey = d.key
                    //var newValue=d[0].data[d.key]
                    return d})
                .enter().append("path")
                .attr("id", d=>"rc".concat(d.data.key))
                .attr("d", d3.arc()
                    .innerRadius(function(d) { return y(d[0]); })
                    .outerRadius(function(d) { return y(d[1]); }) //this gives the path points for the outer radius
                    .startAngle(function(d) { return x(d.data.key); }) //d.data.State = key
                    .endAngle(function(d) { return x(d.data.key) + x.bandwidth(); }) //d.data.State = key
                    .padAngle(0.01)
                    .padRadius(innerRadius))
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave);
            
            label = g.append("g")
                .selectAll("g")
                .data(data)
                .enter().append("g")
                .attr("text-anchor", "middle")
                .attr("transform", function(d) { 
                    //console.log("d.key is",d.key)
                    return "rotate(" + ((x(d.key) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)"; });
            
            label.append("line")
                .attr("x2", -5)
                .attr("stroke", "#000");
            
            label.append("text")
                .attr("transform", function(d) { return (x(d.key) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)"; })
                .text(function(d) { return d.key; })
                .style("font","25px times");
            
            yAxis = g.append("g")
                .attr("text-anchor", "end");
            
            yTick = yAxis
                .selectAll("g")
                .data(y.ticks(10).slice(1))
                .enter().append("g");
            
            yTick.append("circle")
                .attr("fill", "none")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.5)
                .attr("r", y);
            
            yTick.append("text")
                .attr("x", -6)
                .attr("y", function(d) { return -y(d); })
                .attr("dy", "0.35em")
                .attr("fill", "none")
                .attr("stroke", "#fff")
                .attr("stroke-linejoin", "round")
                .attr("stroke-width", 3)
                .text(y.tickFormat(10, "s"));
            
            yTick.append("text")
                .attr("x", -6)
                .attr("y", function(d) { return -y(d); })
                .attr("dy", "0.35em")
                .text(y.tickFormat(10, "s"));
            
            yAxis.append("text")
                .attr("x", -6)
                .attr("y", function(d) { return -y(y.ticks(10).pop()); })
                .attr("dy", "-1em")
                .text("Population");
            
            legend = g.append("g")
                .selectAll("g")
                .data(keys.reverse()) //data.columns.slice(1) =keys
                .enter().append("g")
                .attr("transform", function(d, i) { return "translate(300," + (i - (keys.length - 1) / 2) * 20 + ")"; });
            
            legend.append("rect")
                .attr("width", 19)
                .attr("height", 16)
                .attr("fill", z);
            
            legend.append("text")
                .attr("x", 24)
                .attr("y", 9)
                .attr("dy", "0.35em")
                .text(function(d) { return d; }); 
            }
            
        };

        //-------------Tooltip----------------------
        Tooltip = d3.select("#lcdivid")
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
        .style("stroke", "yellow")
        .attr("stroke-width", 5)
        .style("opacity", 1)
        }

       // {ASSAULT:41,THEFT:208,MOTOR VEHICLE THEFT:}

        function mousemove(d){
        total = 0
        target = d[1]
        keyname = "nothing"
        value = "nothing"
        
        for (i in d.data){
            if(i !="key"){
            //console.log("key is ",i + " value is:"+d.data[i])
            total +=d.data[i]
            if(total ==target){
            //  console.log("total is",total)
                keyname = i;
                value = d.data[i]
            //  console.log("keyname",keyname)
            //  console.log("value",value)
                break
            }}

        }
        
        Tooltip
              .html("Value: " + value) 
              .html("<h3>" + keyname + ": " + value + "</h3>") 
              .style("left", (d3.mouse(this)[0]+300) + "px")
              .style("top", (d3.mouse(this)[1]+650) + "px")
          }


        function mouseleave(){
        Tooltip
        .style("opacity", 0)
        d3.select(this)
        .style("stroke", "none")

        }


    //This function takes in flat data 
    //and keys to group by
    //returns a grouped object is list
    function groupBy(data, key1, key2) {
    let uniqueKey1s = getUnique(data, key1).sort((a, b) => a - b)
    let uniqueKey2s = getUnique(data, key2)
    //console.log("uniqueKey1s: ", uniqueKey1s)
    //let dict1 = {}
    dict1 = uniqueKey1s.map(val1 => {console.log(val1); return({"key": val1})})
    //dict1 = dict1.sortBy('key');;
    console.log("dict1: ", dict1)
    //console.log(dict)
    
    index = 0
    uniqueKey1s.forEach(key1Value=> {
        dataOnlykey1 = data.filter(val => val.properties[key1] === key1Value)
        uniqueKey2s.forEach(key2Value=> {
            listOfValue = dataOnlykey1.filter(val => val.properties[key2] === key2Value)
            count = listOfValue.length
            if (key1Value === dict1[index].key) { dict1[index][key2Value] = count}
        });
        index++;
    });
    //console.log(dict)
    return dict1
    }


    function getUnique(data, key) {
        //console.log("data in unique", data)
        //console.log("key", key)
        const unique = [...new Set(data.map(item => item.properties[key]))];
        return unique
    }

function gettotal(data, key) {
    uniqueKey = getUnique(data, key)
    crimeCount = uniqueKey.map(val1=>{
        dataOnlykey = data.filter(val2 => val2.properties[key] === val1)
        count = dataOnlykey.length
        //console.log("count", count)
        return count
    })
    return Math.max(...crimeCount)
  }
  
//unused function to take the top K keys instead of all them. 
function topKData(data,k){
    testdata = []

    test = data
    keys=[]
    sortable =[]

    for (test of data){
        for ( i in test){
            if (i != "key"){
                sortable.push([i,test[i]])
            }
        }

        sortable.sort(function(a,b){
            return a[1] - b[1]

        })
        sortable = sortable.slice(sortable.length-k,sortable.length-1)

        sortable.push(["key",test["key"]])
        console.log("new sortable is",sortable)

        objSorted ={}
        sortable.forEach(function(item){
            if(item[0] != "key" && !(keys.includes(item[0]))){
            console.log("the item[0] is",item[0])
            keys.push(item[0])
            }
            objSorted[item[0]]=item[1]
        })
        console.log("keys",keys)
        console.log("the new sort is ", objSorted)
    
        data = objSorted
        testdata.push(objSorted)
    }
    return [testdata,keys]
}




    return chart;
};

//global function that came inc
(function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("d3-scale")) :
    typeof define === "function" && define.amd ? define(["exports", "d3-scale"], factory) :
    (factory(global.d3 = global.d3 || {}, global.d3));
  }(this, function(exports, d3Scale) {
    'use strict';
  
    function square(x) {
      return x * x;
    }
  
    function radial() {
      var linear = d3Scale.scaleLinear();
  
      function scale(x) {
        return Math.sqrt(linear(x));
      }
  
      scale.domain = function(_) {
        return arguments.length ? (linear.domain(_), scale) : linear.domain();
      };
  
      scale.nice = function(count) {
        return (linear.nice(count), scale);
      };
  
      scale.range = function(_) {
        return arguments.length ? (linear.range(_.map(square)), scale) : linear.range().map(Math.sqrt);
      };
  
      scale.ticks = linear.ticks;
      scale.tickFormat = linear.tickFormat;
  
      return scale;
    }
  
    exports.scaleRadial = radial;
  
    Object.defineProperty(exports, '__esModule', {value: true});
  }));