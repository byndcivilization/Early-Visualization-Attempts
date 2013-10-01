// set vis dimensions
var width = 960,
    height = 400;

// path shortcode
var path = d3.geo.path();

//initialize vis
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// queue data to be loaded    
queue()
    .defer(d3.json, "../data/world.json")
    .defer(d3.json, "../data/indicators.json")
    .await(ready);

// initialization function
function ready(error, world, indicators) {
  // Set all checks to ture
  checkedObj = {"youth":true, "education":true, "health":true, "inequality":true, "nutrition":true, "water":true, "poverty":true, "corruption":true}

  // Calculates redness and adds text objects
  function redConstructor(countries,checkedObj) {
    var insertObj = {};

    for (var indicator in indicators) {
      if (checkedObj[indicator]==true){
        reds = indicators[indicator]["reds"];

        for (i=0;i<reds.length;i++){
          country = reds[i][0];
          indYear = String(reds[i][1]);
          indValue = reds[i][2];

          if ( insertObj.hasOwnProperty(country)){
            insertObj[country]["redValue"] = insertObj[country]["redValue"] +  1;
          }else{
            insertObj[country] = {};
            insertObj[country]["redValue"] = 1;
            insertObj[country]["indicators"] = {};
          }
          
          if (indicator=="corruption"){
            insertObj[country]["indicators"][indicator] = indYear + " " + indicator + ": " + indValue
          }else{
            insertObj[country]["indicators"][indicator] = String(reds[i][1]) + " " + indicator + ": " + Math.round(indValue * 100) + "%";
          }  
        }
      }
    }

    // Insert components into countries object
    for (var country in countries["features"]){
      countries["features"][country]["properties"]["redValue"] = 0;

      // feature.data.properties.context = data[x].description;
      for (var iso in insertObj){

        if (countries["features"][country]["id"] == iso){
          countries["features"][country]["properties"]["indicators"] = insertObj[iso]["indicators"];
          countries["features"][country]["properties"]["redValue"] = insertObj[iso]["redValue"];
        }
      }
    }
  }

  var projection = d3.geo.equirectangular()
                     .scale(150);

  var path = d3.geo.path()
               .projection(projection);

  var countries = topojson.feature(world, world.objects.countries);
  redConstructor(countries,checkedObj);

  // Initialize tool tip div
  // var tooltip = d3.select("body")
  //   .append("div")
  //   .style("position", "absolute")
  //   .style("z-index", "10")
  //   .style("visibility", "hidden")
  //   .text("THIS IS A TOOTLTIP");

  // Populate map
  svg.selectAll("path")
    .data(countries.features)
    .enter().append("path")
    .attr("d", path)
    .attr("class", function(d) { return "q" + d.properties.redValue + "-9";})
    ///////// BASIC TOOLTIP FUNCITONALITY
    .append("svg:title")
    .text(function(d){
      if (d.properties.indicators){
        text = "";
        for (key in d.properties.indicators) {
          text = text + d.properties.indicators[key] + "\n";
        }
        if (text != ""){
          return text.slice(0,text.length-1);
        }
      }
    });
    ///////// PROTOTYPE FANCY TOOLTIP FUNCITONALITY
    // .on("mouseover", function(){ 
    //   return tooltip.style("visibility", "visible"); 
    //   return tooltip.text(function(d){
    //     if (d.properties.indicators){
    //       text = "";
    //       for (key in d.properties.indicators) {
    //         text = text + d.properties.indicators[key] + "\n";
    //       }
    //       if (text != ""){
    //         return text;
    //       }
    //     }
    //   }); 
    // })
    // .on("mousemove", function(){ 
    //   return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px"); 
    // })
    // .on("mouseout", function(){ 
    //   return tooltip.style("visibility", "hidden") 
    // });
    

  // Checkbox funcionality
  d3.selectAll(".checkbox")
    .on("change", function() {
      indicators[this.value]["checked"] = this.checked;
      checkedObj[this.value] = this.checked;
      redConstructor(countries,checkedObj);
      svg.selectAll("path")
        .data(countries.features)
        .attr("class", function(d) { return "q" + d.properties.redValue + "-9";})
        .select("title").text( function(d){
          if (d.properties.indicators){
            text = "";
            for (key in d.properties.indicators) {
              text = text + d.properties.indicators[key] + "\n";
            }
            if (text != ""){
              return text.slice(0,text.length-1);
            }
          }
      });
  });
}