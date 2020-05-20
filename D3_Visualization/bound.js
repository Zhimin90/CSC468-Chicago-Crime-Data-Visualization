function runD3() {
    
var months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

// Setup our svg layer that we can manipulate with d3
var container = map.getCanvasContainer()
var svg = d3.select(container).append("svg")

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


var g = svg.append('g');
var mapLayer = g.append('g')
    .classed('map-layer', true);

var path = d3.geoPath()
//var url = "geojson_density_map.json";
//var url = "Crime_2020_lowres.geojson"

var rasterData = {}
//var bound_url = "Boundaries - Wards (2015-).geojson"
var bound_url = "ChicagoWards2015+_Compressed.geojson"

var clickedColor = "red";
var baseColor = "lightblue"
var highlightUnselected = "pink"
var highlightSelected = "darkred"
var clickedLog = {};
var indexSorted = {}

d3.json(bound_url, function (err, data) {
    console.log(data)
    var features = data.features;

    function reRenderBoundaries() {
        features.forEach(feature => {
            pathNODES[indexSorted[+feature.properties.ward]].setAttribute("d", path.projection(getD3())(feature))
        });
    };

    // re-render our visualization whenever the view changes
    map.on("viewreset", function () {
        //         render()
        reRenderBoundaries()
        colorWard()
    })
    map.on("move", function () {
        //         render()
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
        .on("mouseover", mouseOver) //turns the grid light pink when you mouse over it
        .on("mouseout", mouseOut) //when you move mouse out of area, it goes back to normal
        .on("click", mouseClick) //when you click on area, it turns dark red. 
    //alert("ward is:" + d.properties.ward)

    //Build index for DOM object from ward to array
    var wards = document.getElementsByClassName("map-layer-bound")
    var pathNODES = Array.from(wards)
    console.log(pathNODES.length)
    data.features.forEach(feature => {
        for (i = 0; i < pathNODES.length; i++) {
            if (feature.properties.ward === /ward([0-9]+)/g.exec(pathNODES[i].id)[1]) {
                indexSorted[+feature.properties.ward] = i
            }
        }
    });

    reRenderBoundaries()

}); //end of jsonBound function

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

function mouseClick(d) {
    var ward = d3.select(this);

    if (ward.classed("clicked")) {
        delete clickedLog[d.properties.ward];
        ward.classed("clicked", false)
        ward.style("fill", baseColor)
    }
    else {
        clickedLog[d.properties.ward] = "#ward" + d.properties.ward;
        ward.classed("clicked", true)
        ward.style("fill", clickedColor)
    }

}

function mouseOut(d) {
    var c = d3.select(this);
    if (c.classed("clicked")) {
        c.style("fill", clickedColor)

    } else {
        d3.select(this).attr("fill-opacity", "0.2")
            .style('fill', baseColor)
    }
}

function mouseOver(d) {
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

// When clicked, zoom in
function clicked(d) {
    var x, y, k;

    // Compute centroid of the selected path
    if (d && centered !== d) {
        var centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 4;
        centered = d;
    } else {
        x = width / 2;
        y = height / 2;
        k = 1;
        centered = null;
    }// Highlight the clicked province
    mapLayer.selectAll('path')
        .style('fill', function (d) { return centered && d === centered ? '#D5708B' : fillFn(d); });

    // Zoom
    g.transition()
        .duration(750)
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');
} 

}
