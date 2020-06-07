function runD3(geojson) {

//console.log(geojson)



// we calculate the scale given mapbox state (derived from viewport-mercator-project's code)
// to define a d3 projection
function getD3() {
    var bbox = document.body.getBoundingClientRect();
    var center = map.getCenter();
    var zoom = map.getZoom();
    // 512 is hardcoded tile size, might need to be 256 or changed to suit your map config
    var scale = (512) * 0.5 / Math.PI * Math.pow(2, zoom);
    //console.log(center.lng, center.lat)
    var d3projection = d3.geoMercator()
        .center([center.lng, center.lat])
        .translate([bbox.width / 2, bbox.height / 2])
        .scale(scale);

    return d3projection;
}

var bound_url = "wards"

var clickedColor = "yellow";
var baseColor = "lightblue"
var highlightUnselected = "pink"
var highlightSelected = "darkred"
var clickedLog = {};
var indexSorted = {}

var dispatchSelected = d3.dispatch("selected");
var dispatchDeselected = d3.dispatch("deselected");
var selectedWards = {}

var savedData

function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

//Fetch Ward Bounds
d3.json(bound_url, function (err, data) {
    
    //console.log(data)
    let wardD3 = new D3WardB(data);
    

    dispatchSelected
        .on("selected", function (data) {
            //get clientHeight
            padding = screen.height / 8
            var h = screen.height/ 3 - padding;
            console.log("h: ", h)

            if (isEmpty(data)) { data = savedData } else { savedData = data }
            console.log("Dispatching select...", data)
            //Aggregate Selected Wards Data
            let clickedWard = geojson.features.filter(val => val.properties.ward === data.properties.ward)
            // console.log(clickedWard )
            selectedWards[data.properties.ward] = clickedWard
            console.log(selectedWards)

            let selectedValues = Object.keys(selectedWards).map(function (key) {
                return selectedWards[key];
            });

            crosstab = Crosstab()

            if (d3.select("#crosstabselector").empty()){
                crosstab.selector()
                d3.select("#crosstabselector").on("click", d => {
                    dispatchSelected.call("selected", {}, {})
                })    //selector must be on top
            }

            //create svg for crosstab
            d3.select("svg.crosstabchart").remove()
            var barSvg = d3.select("body").select("div.crosstabchart")
                .append("svg")
                .classed("crosstabchart",true)
                .attr("id", "bar")
                .attr("width", 800)
                .attr("height", h + padding/2)

            
            crosstab.barchart(barSvg,selectedValues.flat())
            

            d3.select("svg.linechart").remove()
            var lineSvg = d3.select("body").select("div.linechart")
                .append("svg")
                .classed("linechart", true)
                .attr("id", "linesvg")
                .attr("width",800)
                .attr("height", h + padding/2)

            linegraph = Linechart();
            linegraph.drawChart(lineSvg,selectedValues.flat());
            
            
            
            radialgraph=Radialchart()
            if (d3.select("#radialselector").empty()) {
                radialgraph.selector()
                d3.select("#radialselector").on("click", d => {
                    dispatchSelected.call("selected", {}, {})
                })    //selector must be on top
            }
            d3.select("svg.radialchart").remove()
            var radialSvg = d3.select("body").select("div.radialchart")
                .append("svg")
                .classed("radialchart", true)
                .attr("width", 690)
                .attr("height", h)
            radialgraph.drawRadialChart(radialSvg,selectedValues.flat())
            
        });


    dispatchDeselected
        .on("deselected", function (data) {
            //get clientHeight
            padding = screen.height / 8
            var h = screen.height / 3 - padding;
            console.log("h: ", h)

            console.log("Dispatching deselect...", data)

            delete selectedWards[data.properties.ward]

            let selectedValues = Object.keys(selectedWards).map(function (key) {
                return selectedWards[key];
            });

            //create svg for crosstab
            d3.select("svg.crosstabchart").remove()
            var barSvg = d3.select("body").select("div.crosstabchart")
                .append("svg")
                .classed("crosstabchart", true)
                .attr("id", "bar")
                .attr("width", 800)
                .attr("height", h + padding / 2)

            crosstab = Crosstab()
            crosstab.barchart(barSvg, selectedValues.flat())

            d3.select("svg.linechart").remove()
            var lineSvg = d3.select("body").select("div.linechart")
                .append("svg")
                .classed("linechart", true)
                .attr("id", "linesvg")
                .attr("width",800)
                .attr("height", h + padding / 2)

            linegraph = Linechart();
            linegraph.drawChart(lineSvg,selectedValues.flat());

            d3.select("svg.radialchart").remove()
            var radialSvg = d3.select("body").select("div.radialchart")
            .append("svg")
            .classed("radialchart",true)
            .attr("width",700) //690
            .attr("height", h) //375
            
            radialgraph=Radialchart()
            radialgraph.drawRadialChart(radialSvg,selectedValues.flat())
        });

}); //end of jsonBound function

/******************Boundary D3 Class**********************************************************/

class D3WardB {
    constructor(geojson){
        // Setup our svg layer that we can manipulate with d3
        let container = map.getCanvasContainer()
        // d3.select(container).append("div").attr("id", "maplayerid").classed("tooltip", true)
        
        let svg = d3.select(container).append("svg")
        let features = geojson.features;
        let g = svg.append('g');
        let mapLayer = g.append('g')
            .classed('map-layer', true);
        let path = d3.geoPath()

        function reRenderBoundaries() {
            features.forEach(feature => {
                pathNODES[indexSorted[+feature.properties.ward]]
                    .setAttribute("d", path.projection(getD3())(feature))
            });
        };

        // re-render our visualization whenever the view changes
        //map references to mapbox instance
        map.on("viewreset", function () {
            reRenderBoundaries()
            colorWard()
        })

        map.on("move", function () {
            reRenderBoundaries()
            colorWard()
        })

        // render our initial visualization
        mapLayer.selectAll('path.map-layer-bound')
            .data(features)
            .enter()
            .append('path')
            .classed('map-layer-bound', true)
            .attr("id", function (d) { return "ward" + d.properties.ward })
            .attr('d', path.projection(getD3()))
            .attr('vector-effect', 'non-scaling-stroke')
            .style('stroke', "black")
            .attr("fill-opacity", "0.2")
            .style('fill', "lightblue")
            .on("mouseover", mouseOver) 
            .on("mouseout", mouseOut) 
            .on("click", mouseClick) 
            .on("mousemove", mousemove)                                

        //Build index for DOM object from ward to array
        let wards = document.getElementsByClassName("map-layer-bound")
        let pathNODES = Array.from(wards)
        //console.log(pathNODES.length)
        geojson.features.forEach(feature => {
            for (let i = 0; i < pathNODES.length; i++) {
                //regular expression
                if (feature.properties.ward === /ward([0-9]+)/g.exec(pathNODES[i].id)[1]) {
                    indexSorted[+feature.properties.ward] = i
                }
            }
        });

        reRenderBoundaries()
    }
}

/******************D3 helper functions********************************************************/

//record clicked ward when the map is moved
function colorWard() {

    
    for (var ward in clickedLog) {
        d3.select(clickedLog[ward])
            .classed("clicked", true)
            .style("fill", clickedColor)
    }

}

// Get province name length
function nameLength(d) {
    var n = nameFn(d);
    return n ? n.length : 0;
}

// Get province color
function fillFn(d) {
    return color(Math.random());
}

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


    function mousemove(d){
        Tooltip
          .html("<h3>Ward: " + d.properties.ward + "</h3>")
          .style("left", (d3.mouse(this)[0]+50) + "px")
          .style("top", (d3.mouse(this)[1]) + "px")
      }

    function mouseOut(d) {
        Tooltip
        .style("opacity", 0)
      d3.select(this)
        .style('stroke', "black")
        .attr("stroke-width", 1)
        
        syncHighlightRemove(this)
        var c = d3.select(this);
        if (c.classed("clicked")) {
            c.style("fill", clickedColor)

        } else {
            d3.select(this).attr("fill-opacity", "0.2")
                .style('fill', baseColor)
        }
    }

    //highlight
function mouseOver(d) {
    Tooltip
    .style("opacity", 0.7)
  d3.select(this)
    .style("stroke", "yellow")
    .attr("stroke-width", 5)
    .style("opacity", 1)

    syncHighlight(this)
    var c = d3.select(this)
    if (c.classed("clicked")) {
        c.style("fill", highlightSelected)
    }
    else {
        d3.select(this).style("fill", highlightUnselected);
        // Draw effects
        //textArt(nameFn(d));
    }
}

function mouseClick(d) {
    var ward = d3.select(this);

    if (ward.classed("clicked")) {
        // dispatchDeselected.call("deselected", {}, d);
        delete clickedLog[d.properties.ward];
        ward.classed("clicked", false)
        ward.style("fill", baseColor)
        dispatchDeselected.call("deselected", {}, d);
    }
    else {
            //console.log("This is: ", this)
            dispatchSelected.call("selected", {}, d);
            clickedLog[d.properties.ward] = "#ward" + d.properties.ward;
            ward.classed("clicked", true)
            ward.style("fill", clickedColor)
        }

    // Only show panel if there are a chart, hide if no chart
    var panel = document.getElementById("chartpanelid")
    if(Object.keys(clickedLog).length != 0){
        panel.style.display = "block";
    } else if(Object.keys(clickedLog).length == 0){
        panel.style.display = "none";
    }
    

    }


function syncHighlight(ward){
    var ward = ward.id.replace("ward", "");
    d3.select("#lc".concat(ward))
        .style("stroke-width", 10)
        .style("opacity", 1)
    d3.selectAll("#ct".concat(ward))
        .style("stroke", "yellow")
        .attr("stroke-width", 5)
        .style("opacity", 1)
    d3.selectAll("#rc".concat(ward))
        .style("stroke", "yellow")
        .attr("stroke-width", 5)
        .style("opacity", 1)  
}//syncHighlight

function syncHighlightRemove(ward){
    var ward = ward.id.replace("ward", "");
    d3.select("#lc".concat(ward))
        .style("stroke-width", 3.5)
        .style("opacity", 1)
    d3.selectAll("#ct".concat(ward))
        .style("stroke", "none")    
    d3.selectAll("#rc".concat(ward))
        .style("stroke", "none")   

}//syncHighlightRemove

}
