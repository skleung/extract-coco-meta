var fs = require('fs');
var request = require('request');
var obj = JSON.parse(fs.readFileSync('10k.json', 'utf8'));
var FLICKR_API_URL = "https://api.flickr.com/services/rest/"
var API_KEY = "47ae61451f25e8891fb6e5c0166ab57d"
var STATUS_OK = 200;

var good_ids = [];
var all_ids = [];
var output = [];
var counter = obj.length;

// difference of arrays helper
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

var writeOutput = function() {
  fs.writeFile( "output.json", JSON.stringify(output), "utf8", function(){ console.log("done writing output.")} );
  fs.writeFile( "failed.json", all_ids.diff(good_ids), "utf8", function(){ console.log("done writing output.")} );
}

var next = function() {
  console.log(counter);
  if (--counter == 0) {
    writeOutput();
  }
}


for (var i=0; i<obj.length; i++) {
  var image = obj[i];
  var id = image["image_id"];
  all_ids.push(id);
  var url = image["url"];
  var params = {
    photo_id: parseInt(id),
    format: "json",
    nojsoncallback: "1",
    api_key: API_KEY,
    method: "flickr.photos.getExif"
  }
  request.get({
    url: FLICKR_API_URL,
    qs: params
  }, function(error, response, data) {
    next();
    if (error) {
      console.log("ERROR: image_id = "+id);
    } else if (response.statusCode !== STATUS_OK) {
      console.log("Received bad status code: " + response.statusCode +" for image_id = "+id);
    } else {
      var parsed_data = JSON.parse(data);
      if (parsed_data["stat"] !== "fail") {
        var exif = parsed_data["photo"]["exif"];
        // console.log("EXIF = "+exif);
        for (var i=0; i<exif.length; i++) {
          var tag = exif[i];
          if (tag["label"] === "Date and Time") {
            var id = parsed_data["photo"]["id"];
            var date_time = tag["raw"]["_content"];
            output.push({image_id: id, timestamp: date_time});
            good_ids.push(id);
          }
        }
      } else {
        console.log("FAILED." + data);
      }
    }
  });
}

