var when = require("when"),
    sequence = require("when/sequence"),
    guard = require('when/guard'),
    _ = require("underscore"),

    db = require("../lib/db"),
    processFile = require("./processFile"),
    addPlaces = require("./writers/addPlaces"),
    addPeople = require("./writers/addPeople");

var logData = function (data) {
  console.log(data);
  console.log(typeCounts);
  console.log(_.keys(data).length, "out of", totalCount);
  
  var expressType = function(types) {
    var k = _.keys(types);
    k.sort(function (a, b) {
      return (types[a] < types[b] ? 1 : 
        (types[a] === types[b] ? 0 : -1));
    });
    k.reverse();
    _.each(k, function (kv) {
      if (!typeCounts[kv]) {
        console.log(kv, types[kv]);
      }
    });
    console.log("")
  }
  expressType(dateTypes);
  expressType(yearTypes);
  expressType(placeTypes);
};

var n = Math.floor(20516861 / 100);

var file = "/home/pretzel/Downloads/dbpedia_data/mappingbased_properties_en.nq";

process.on('uncaughtException', function(err) {
  console.log(err);
});

console.log("processing file");

processFile(file, n).then(function (data) {
  // logData(data);
  sequence(
    [addPlaces, addPeople], 
    data
  ).then(
    function () {
      process.exit(0);
    }, 
    function (e) {
      console.log("failed",e);
    }
  );
});
