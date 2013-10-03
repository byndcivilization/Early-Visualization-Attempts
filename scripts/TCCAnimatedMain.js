///////D3 CONFIG VARIABLES
// set vis dimensions
var margin = {top: 0, right: 5, bottom: 5, left: 5},
    width = 960 - margin.right,
    height = 400 - margin.top - margin.bottom;

// var margin = {top: 0, right: 5, bottom: 5, left: 5},
//     width = 430 - margin.right,
//     height = 250 - margin.top - margin.bottom;

//set projection
var projection = d3.geo.equirectangular()
                   .scale(150);

//set d3 path
var path = d3.geo.path()
             .projection(projection);

//initialize vis
var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

// queue data to be loaded    
queue()
    .defer(d3.json, "../data/world.json")
    .defer(d3.json, "../data/tcc.json")
    .await(ready);


function ready(error,world,data){

    ///////CONVENIENCE FUNCTIONS
    //Create date  key/value array using construtor
    function date_obj_constructor(data){
        var date_obj = {};
        for(var i = 0; i < num_dates; i++) {
            date_obj[i+1] =  data[i].date;
        }
        return date_obj;
    }

    //Find max for a given month
    function find_max(data) {
        var max = 0;
        for(var key in data.countries) {
            if(data.countries[key].contributions.num_tot > max) {
                max = data.countries[key].contributions.num_tot;
            }
        }        
    return max;
    }

    //Loop over months to find max for each month and add to array of max contribution values
    function max_obj_constructor(data) {
        var max_obj = {};
        for(var i=0;i<num_dates;i++) {
            max_obj[i+1] = find_max(data[i]);
        }
        return max_obj;
    }

    //construct an array of contributions for a given country in a given month to bind to geojson
    function contribution_obj_constructor(data, tcc_id, geojson) {
        var contributions = {};
        for(var i=0;i<num_dates;i++) {
            if(data[i]["countries"][tcc_id]) {
                contributions[i+1] = data[i]["countries"][tcc_id]["contributions"]; 
            }else{
                contributions[i+1] = {"dist_mean":0,"dist_mean":0,"milobvs_mean":0,"num_milobvs":0,"num_missions":0,"num_pol":0,"num_tot":0,"num_troops":0,"pol_mean":0,"tot_mean":0,"troops_mean":0};
           }
        }
        return contributions;
    }

    //constructs an array of formats for a given country in a given month and binds to geojson
    //category sets which property to use for chlorpleth, default is total contriubtions
    function format_obj_constructor(data, geojson, category) {
        if (typeof(category)==="undefined") { category = "num_tot"};
        var formats = {};
        for(var i=1;i<=num_dates;i++) {
            var percentile = geojson.properties.contributions[i][category] / max_obj[i];
            if(percentile != 0) {
                formats[i] = "q" + ((~~(percentile*7)) + 1) + "-9";
            }else{
                formats[i] = "countries";
            }        
        }
        return formats;
    }

    ///////PRE PROCESSING
    //read in geojson into countries
    var countries = topojson.feature(world, world.objects.countries);

    // //Add date label/control layer and add SVG elements that take on attributes determined by load function
    // var label_layer = d3.select("#map").insert("svg:g").attr("id","label");

    //Find number of date entries in tcc jason
    var num_dates = Object.keys(data).length;

    //Create date array to populate date label
    var date_obj = date_obj_constructor(data);
    
    //Create array for creating color scales for each month
    var max_obj = max_obj_constructor(data);

    //Bind geojson and json data
    var geojson = countries.features;
    geojson.dates = date_obj;

    for(var i=0;i<geojson.length;i++) {
        var tcc_id = geojson[i].id;
        geojson[i].properties.contributions = contribution_obj_constructor(data, tcc_id, geojson[i]);
        geojson[i].properties.formats = format_obj_constructor(data, geojson[i]);
    }


    ///////////////////////////////
    //Load and incriment 
    ///////////////////////////////

     function incrementor(i, geojson, date_obj) {
        setTimeout(function() {
            if(i!=1){
                svg.selectAll("path")
                   .data(geojson)
                   .attr("class", function(d) { return d.properties.formats[i];});
                svg.select("#label")
                    .text(function(){return date_obj[i]});
            }else{
                //do nothing
            }
        }, 250*i);
    }

    svg.selectAll("path")
       .data(countries.features)
       .enter().append("path")
       .attr("d", path)
       .attr("id",function(d) { return d.id; })
       .attr("class", function(d) { return d.properties.formats[1];});

    svg.append("text")
       .attr("id", "label")
       .attr("font-family", "Helvetica")
       .attr("font-size", "90px")
       .attr("font-weight", "900")
       .attr("fill", "#000000")
       .attr("stroke", "#ffffff")
       .attr("text-anchor", "end")
       .attr("y", height - 10)
       .attr("x", width - (width - 250))
       .text(date_obj[1]);

    for(var i=1;i<=num_dates;i++) {
        var timer = incrementor(i, countries.features, date_obj);
    }
}