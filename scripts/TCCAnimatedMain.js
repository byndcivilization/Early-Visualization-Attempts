//Polymaps namespace
var po = org.polymaps;

//Chart dimensions
var margin = {top: 0, right: 5, bottom: 5, left: 5};
var w = 430 - margin.right;
var h = 250 - margin.top - margin.bottom;

// Create the map object, add it to #map div
var map = po.map()
    .container(d3.select("#map").append("svg:svg").attr("width", w + margin.left + margin.right).attr("height",h +margin.top + margin.bottom).node())
    .center({lat: 25, lon: 20})
    .zoom(.8)
    .zoomRange([.8, 3])
    .add(po.interact());

// Add the CloudMade image tiles as a base layer…
map.add(po.image()
    .url(po.url("http://{S}tile.cloudmade.com"
    + "/1a1b06b230af4efdbb989ea99e9841af" // http://cloudmade.com/register
    + "/20760/256/{Z}/{X}/{Y}.png")
    .hosts(["a.", "b.", "c.", ""])));

//Import contribution data
d3.json("../data/tcc.json", function(data){
    //find length of json data object and loop over it at interval
    var dataLength = Object.keys(data).length;

    //Create date  key/value array using construtor
    function date_array_constructor() {
        var dateArray = {};
            for(var i = 0; i < dataLength; i++) {
                var d = i + 1;
                dateArray[d] =  data[i].date;
            }
        return dateArray;
    }
    var dateArray = date_array_constructor();

    //Add geojson layer
    map.add(po.geoJson()
        .url("../data/world.json")
        .tile(false)
        .zoom(3)
        .on("load", load));
    map.container().setAttribute("class", "Blues");
    map.add(po.compass()
        .pan("none"));

    //Add date label/control layer and add SVG elements that take on attributes determined by load function
    var labelLayer = d3.select("#map svg").insert("svg:g");

    function find_max(data, dataLength) {
        var max = 0;
        for(var i in data) {
            if(data[i] > max) {
                max = data[i] + 1;
            }
        }
        return max;
    }

    function max_array_constructor(data, dataLength) {
        var maxArray = {};
        for(var i=0;i<dataLength;i++) {
            var d = i+1;
            maxArray[d] = find_max(data[i].contributions);
        }
        return maxArray;
    }
    var maxArray = max_array_constructor(data, dataLength);

    function contribution_array_constructor(data, dataLength, tccName, feature) {
        var contributions = {};
        //iterate over date entries
        for(var i=0;i<dataLength;i++) {
            //contribution iterator
            contributions[i+1] = 0;
            for(x in data[i].contributions){
                if(x == tccName) {
                    contributions[i+1] = data[i].contributions[x];
                }
            }
        }
        return contributions;
    }


    function format_array_constructor(data, dataLength, maxArray, feature) {
        var formats = {};
        for(var i=0;i<dataLength;i++) {
            var percentile = feature.data.contributions[i+1] / maxArray[i+1];
            if(percentile != 0){
                var v = "q" + ((~~(percentile*7)) + 2) + "-" + 9;
            }else{
                var v = "countries";
            }
            formats[i+1] = v;
        }
        return formats;
    }


    ///////////////////////////////
    //load function
    ///////////////////////////////
    function load(e) {
        //Bind geojson and json
        var geojson = e.features;
        geojson.dates = dateArray;
        for(var x = 0; x < geojson.length; x++) {
            var tccName = geojson[x].data.properties.name;
            geojson[x].data.contributions = contribution_array_constructor(data, dataLength, tccName, geojson[x]);
            geojson[x].data.formats = format_array_constructor(data, dataLength, maxArray, geojson[x]);
            var n = geojson[x].data.properties.name;
            n$(geojson[x].element).attr("id",n);
        }

        //Load initial state
        load_country_class_constructor(1, geojson);

        //Insert date label
        var dateLabel = labelLayer.append("text")
            .attr("font-family", "Helvetica")
            .attr("font-size", "45px")
            .attr("font-weight", "900")
            .attr("fill", "#000000")
            .attr("stroke", "#ffffff")
            .attr("text-anchor", "end")
            .attr("x", w-305)
            .attr("y", h-3)
            .text(dateArray[1]);


        function country_class_constructor(local, geojson){
            for(var x=0;x<geojson.length;x++){
                var n = geojson[x].data.properties.name;
                element = document.getElementById(n);
                element.className["animVal"] = geojson[x].data.formats[local];
                element.className["baseVal"] = geojson[x].data.formats[local];

            }

        }

        function load_country_class_constructor(local, geojson){
            for(var x=0;x<geojson.length;x++){
                var n = geojson[x].data.properties.name;
                n$(geojson[x].element)
                    .attr("class", geojson[x].data.formats[local])
                    .add("svg:title");
            }
        }

        //incrementor function
        function incrementor(local, geojson, dateArray) {
            setTimeout(function() {
                //set date label to current iteration
                d3.transition(dateLabel).text(dateArray[local]);
                //construct country classes
                country_class_constructor(local, geojson);
                // document.removeChild(document.documentElement);
            }, 250*local);
        }

        ///////////////////////////////
        //Increment on load
        ///////////////////////////////

        for(var i=1; i< dataLength; i++) {
            //Set incrementer as local variable
            var local = i+1;
            var timer = incrementor(local, geojson, dateArray);
        }
    }
});