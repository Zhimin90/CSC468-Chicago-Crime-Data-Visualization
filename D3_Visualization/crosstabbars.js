

var Crosstab = function () {
    var chart = {
        barchart: function (svg, data) {
            groupKey1 = "ward"
            groupKey2 = "primary_type"

            console.log("in crosstab, data: ", data)
            //data grouping
            dataGrouped = groupBy(data, groupKey1, groupKey2)
            keys = getUnique(data, groupKey2)

            data = dataGrouped

            console.log("Grouped Data: ", data)
            //create d3 helper functions
            margin = ({ top: 10, right: 10, bottom: 20, left: 40 })
            width = +d3.select("svg.crosstabchart").attr("width")
            height = +d3.select("svg.crosstabchart").attr("height")

            //console.log("height ", height)

            groupKey = "key"

            legend = svg => {
                const g = svg
                    .attr("transform", `translate(${width},0)`)
                    .attr("text-anchor", "end")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", 10)
                    .selectAll("g")
                    .data(color.domain().slice().reverse())
                    .enter()
                    .append("g")
                    .attr("transform", (d, i) => `translate(0,${i * 20})`);

                g.append("rect")
                    .attr("x", -19)
                    .attr("width", 19)
                    .attr("height", 19)
                    .attr("fill", color);

                g.append("text")
                    .attr("x", -24)
                    .attr("y", 9.5)
                    .attr("dy", "0.35em")
                    .text(d => d);
            }

            x0 = d3.scaleBand()
                .domain(data.map(d => d[groupKey]))
                .rangeRound([margin.left, width - margin.right])
                .paddingInner(0.1)

            x1 = d3.scaleBand()
                .domain(keys)
                .rangeRound([0, x0.bandwidth()])
                .padding(0.05)

            y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d3.max(keys, key => d[key]))]).nice()
                .rangeRound([height - margin.bottom, margin.top])

            color = d3.scaleOrdinal()
                .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"])

            xAxis = g => g
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .attr("class", "axisWhite")
                .call(d3.axisBottom(x0).tickSizeOuter(0))
                .call(g => g.select(".domain").remove())

            yAxis = g => g
                .attr("transform", `translate(${margin.left},0)`)
                .attr("class", "axisWhite")
                .call(d3.axisLeft(y).ticks(null, "s"))
                .call(g => g.select(".domain").remove())
                .call(g => g.select(".tick:last-of-type text").clone()
                    .attr("x", 3)
                    .attr("text-anchor", "start")
                    .attr("font-weight", "bold")
                    .text(data.y))

            
            
            svg.append("g")
                .selectAll("g")
                .data(dataGrouped)
                .enter()
                .append("g")
                .attr("transform", d => `translate(${x0(d[groupKey])},0)`)
                .selectAll("rect")
                .data(d => keys.map(key => ({ key, value: d[key] })))
                .enter()
                .append("rect")
                .attr("x", d => x1(d.key))
                .attr("y", d => y(d.value))
                .attr("width", x1.bandwidth())
                .attr("height", d => y(0) - y(d.value))
                .attr("fill", d => color(d.key))
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave);
            
            svg.append("g")
                .call(xAxis);
            
            svg.append("g")
                .call(yAxis);
            
            svg.append("g")
                .call(legend);
            
            console.log("ended")
            //return svg.node();
        }
    }
    

//-------------Tooltip----------------------
    var Tooltip = d3.select("#lcdivid")
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

    function mousemove(d){
        Tooltip
          .html("Value: " + d.key) 
          .html("<h3>" + d.key + ": " + d.value + "</h3>") 
          .style("left", (d3.mouse(this)[0]+100) + "px")
          .style("top", (d3.mouse(this)[1]-100) + "px")
      }

    function mouseleave(){
        Tooltip
          .style("opacity", 0)
        d3.select(this)
          .style("stroke", "none")
          
      }
//-------------Tooltip----------------------


//This function takes in flat data 
//and keys to group by
//returns a grouped object is list
function groupBy(data, key1, key2) {
    uniqueKey1s = getUnique(data, key1)
    uniqueKey2s = getUnique(data, key2)

    dict = uniqueKey1s.map(val=> {return({"key": val})})
    //console.log(dict)

    index = 0
    uniqueKey1s.forEach(key1Value=> {
        dataOnlykey1 = data.filter(val => val.properties[key1] === key1Value)
        uniqueKey2s.forEach(key2Value=> {
            listOfValue = dataOnlykey1.filter(val => val.properties[key2] === key2Value)
            count = listOfValue.length
            if (key1Value === dict[index].key) { dict[index][key2Value] = count}
        });
        index++;
    });
    //console.log(dict)
    return dict
}

function getUnique(data, key) {
    //console.log(data)
    const unique = [...new Set(data.map(item => item.properties[key]))];
    return unique
}

    return chart
}