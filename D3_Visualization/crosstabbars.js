var Crosstab = function () {
    var chart = {
        barchart: function (svg, data) {
            //const svg = d3.select(DOM.svg(width, height));
            console.log("in crosstab, data: ", data)
            svg.append("g")
                .selectAll("g")
                .data(data)
                .join("g")
                .attr("transform", d => `translate(${x0(d[groupKey])},0)`)
                .selectAll("rect")
                .data(d => keys.map(key => ({ key, value: d[key] })))
                .join("rect")
                .attr("x", d => x1(d.key))
                .attr("y", d => y(d.value))
                .attr("width", x1.bandwidth())
                .attr("height", d => y(0) - y(d.value))
                .attr("fill", d => color(d.key));

            svg.append("g")
                .call(xAxis);

            svg.append("g")
                .call(yAxis);

            svg.append("g")
                .call(legend);

            //return svg.node();
        }
    }
    
    return chart
}