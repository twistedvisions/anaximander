var when = require("when"),
    sequence = require("when/sequence"),
    guard = require('when/guard'),
    _ = require("underscore"),
    fs = require("fs"),
    humanize = require("humanize"),

    processFile = require("./processFile"),
    addPlaces = require("./writers/addPlaces"),
    addPeople = require("./writers/addPeople");

var n = Math.floor(20516861 / 100);
console.log("reading at most", humanize.numberFormat(n, 0));
var file = require("./config").data_file;

process.on('uncaughtException', function(err) {
  console.log(err);
});

log = function (text) {
  return function () {
    console.log(text)
  }
};

processFile(file, n).then(function (data) {
  console.log("filtered to", humanize.numberFormat(_.keys(data).length, 0));
  // logData(data);
  sequence(
    [
      log("adding places"),
      addPlaces, 
      log("adding people"),
      addPeople
    ], 
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
