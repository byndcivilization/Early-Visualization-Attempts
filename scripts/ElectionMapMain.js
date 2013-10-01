//Polymaps namespace
var po = org.polymaps;

//Chart dimensions
var margin = {top: 20, right: 20, bottom: 20, left: 20};
var w = 300 - margin.right;
var h = 360 - margin.top - margin.bottom;

// Create the map object, add it to #map div
var map = po.map()
    .container(d3.select("#map").append("svg:svg").attr("width", w + margin.left + margin.right).attr("height",h +margin.top + margin.bottom).node())
    .center({lat: 0, lon: 17})
    .zoom(2.6)
    .zoomRange([1.5, 4.5])
    .add(po.interact());

// Add the CloudMade image tiles as a base layer…
map.add(po.image()
    .url(po.url("http://{S}tile.cloudmade.com"
    + "/1a1b06b230af4efdbb989ea99e9841af" // http://cloudmade.com/register
    + "/20760/256/{Z}/{X}/{Y}.png")
    .hosts(["a.", "b.", "c.", ""])));

//Import contribution data
d3.json("../data/elections.json", function(data){

    //Load geojson data on load
    map.add(po.geoJson()
        .url("../data/po_world.json")
        .tile(false)
        .zoom(3)
        .on("load", load));
    map.container();
    map.add(po.compass()
        .pan("none"));

    ///////////////////////////////
    //load function
    ///////////////////////////////
    function load(e) {
        //cycle through geojson elements
        for(var i=0; i < e.features.length; i++) {
            var feature = e.features[i];
            var n = feature.data.id;

            //search for match with geojson and election array and return format
            var v = "countries";
            for(var x=0; x < data.length; x++) {
                if(data[x].iso == n){

                    feature.data.properties.context = data[x].description;
                    if(data[x].format == 0){
                        v = "africa";
                    }else{
                        v = "upcoming";
                    }
                    
                    //Add click event listener to only those with data
                    if (v != "countries") {
                        feature.element.addEventListener("click", update);
                    }
                }
            }
            
            //bind class attribute and mouse over text to svg element
            n$(feature.element)
                .attr("class",v)
                .attr("id",n)
                .add("svg:title")
                .text(feature.data.properties.name + ": " + feature.data.properties.context);
        }

        function update(clicked_id){
            var update = clicked_id.srcElement.id;
            for(var i=0; i < data.length; i++) {

                if(data[i].iso == update){
                    document.getElementById('country').innerHTML = "<b>Country:</b> <br>" + data[i].country;
                    document.getElementById('upcoming').innerHTML = "<b>Upcoming Elections:</b> <br>" + data[i].upcoming;
                    document.getElementById('recent').innerHTML = "<b>Recent Elections:</b> <br>" + data[i].recent;
                    document.getElementById('hos').innerHTML = "<b>Current Head of State:</b> <br>" + data[i].current_hos;
                    document.getElementById('hog').innerHTML = "<b>Current Head of Government:</b> <br>" + data[i].current_hog;
                }
            }
        }
    }
});