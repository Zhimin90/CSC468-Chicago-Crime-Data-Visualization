function runMapbox(map,url) {

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

    //Mapbox crime date filter
    function filterBy(startMonth, endMonth) {
        var filters = ['all', ['>=', 'month', startMonth], ['<=', 'month', endMonth]];
        map.setFilter('crimes-point', filters);
        map.setFilter('crimes-heat', filters);
        map.setFilter('crime-category-labels', filters);

        // Set the label to the month
        //document.getElementById('month').textContent = months[month];
    }

    map.on('load', function () {
        console.log("mapbox loaded")
        d3.json(url, function (err, data) {
            // Create a month property value based on time
            // used to filter against.
            data.features = data.features.map(function (d) {
                d.properties.month = new Date(d.properties.date).getMonth();
                return d;
            });

            //console.log(data)

            map.addSource('crimes', {
                type: 'geojson',
                data: data
            });
            // add heatmap layer here
            map.addLayer({
                id: 'crimes-heat',
                type: 'heatmap',
                source: 'crimes',

                paint: {
                    // increase weight as diameter breast height increases
                    'heatmap-weight': {
                        property: 'dbh',
                        type: 'exponential',
                        stops: [
                            [1, 0],
                            [62, 1]
                        ]
                    },
                    // increase intensity as zoom level increases
                    'heatmap-intensity': {
                        stops: [
                            [11, 1],
                            [15, 3]
                        ]
                    },
                    // assign color values be applied to points depending on their density
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0,
                        'rgba(33,102,172,0)',
                        0.2,
                        'rgb(103,169,207)',
                        0.4,
                        'rgb(209,229,240)',
                        0.6,
                        'rgb(253,219,199)',
                        0.8,
                        'rgb(239,138,98)',
                        1,
                        'rgb(178,24,43)'
                    ],
                    // increase radius as zoom increases
                    'heatmap-radius': {
                        stops: [
                            [11, 15],
                            [15, 20]
                        ]
                    },
                    // decrease opacity to transition into the circle layer
                    'heatmap-opacity': {
                        default: 1,
                        stops: [
                            [14, 1],
                            [15, 0]
                        ]
                    },
                }
            }, 'waterway-label');
            // add circle layer here
            map.addLayer({
                id: 'crimes-point',
                type: 'circle',
                source: 'crimes',
                minzoom: 14,
                paint: {
                    // increase the radius of the circle as the zoom level and dbh value increases
                    'circle-radius': {
                        property: 'dbh',
                        type: 'exponential',
                        stops: [
                            [{ zoom: 15, value: 1 }, 5],
                            [{ zoom: 15, value: 62 }, 10],
                            [{ zoom: 22, value: 1 }, 20],
                            [{ zoom: 22, value: 62 }, 50],
                        ]
                    },
                    'circle-color': [
                        'match',
                        ['get', 'primary_type'],
                        'THEFT',
                        '#fbb03b',
                        'BATTERY',
                        '#223b53',
                        'CRIMINAL DAMAGE',
                        '#e55e5e',
                        'ASSAULT',
                        '#3bb2d0',
                /* other */ '#ccc'
                    ]
                    ,
                    'circle-stroke-color': 'white',
                    'circle-stroke-width': 1,
                    'circle-opacity': {
                        stops: [
                            [14, 0],
                            [15, 1]
                        ]
                    }
                }
            }, 'waterway-label');

            map.addLayer({
                'id': 'crime-category-labels',
                'type': 'symbol',
                'source': 'crimes',
                'layout': {
                    'text-field': ['get', 'primary_type'],
                    'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                    'text-radial-offset': 0.5,
                    'text-justify': 'auto',
                    'text-size': 12
                },
                'paint': {
                    "text-color": "#ffffff"
                }
            });

            // Set filter to first month of the year
            // 0 = January
            filterBy(0, 1);

            //jQuery script for dual bar slider
            $(function () {
                $("#slider-range").slider({
                    range: true,
                    min: new Date('2020.01.01').getTime() / 1000,
                    max: new Date('2020.06.01').getTime() / 1000,
                    step: 6,
                    values: [new Date('2020.01.01').getTime() / 1000, new Date('2020.02.01').getTime() / 1000],
                    slide: function (event, ui) {
                        //console.log(ui.values.map((date) => { return new Date(date * 1000).getMonth()}))
                        let dateRange = ui.values.map((date) => { return new Date(date * 1000).getMonth() })
                        filterBy(dateRange[0], dateRange[1])
                        $("#amount").val((new Date(ui.values[0] * 1000).toDateString()) + " - " + (new Date(ui.values[1] * 1000)).toDateString());
                    }
                });

                $("#amount").val((new Date($("#slider-range").slider("values", 0) * 1000).toDateString()) +
                    " - " + (new Date($("#slider-range").slider("values", 1) * 1000)).toDateString());
            });

        });
    });

    //map.scrollZoom.disable()
    //map.addControl(new mapboxgl.Navigation());
    map.addControl(new mapboxgl.NavigationControl());
    map.dragRotate.disable();
    map.doubleClickZoom.disable();
}