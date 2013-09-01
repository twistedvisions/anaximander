/*global module. unescape*/
var when = require("when"),
    _ = require("underscore"),
    db = require("../../db"),
    utils = require("../utils"),
    addEvent = require("./addEvent");


var placeInsert = _.template(
  "INSERT INTO place (name, location, start_date, end_date, link) " +
  "VALUES ('<%= name %>', " +
  "ST_GeomFromText('POINT(' || <%= lon %> || ' ' || <%= lat %> || ')'), " +
  "<%= start_date %>, <%= end_date %>, '<%= link %>') " +
  "RETURNING id"
);

var cleanLatLon = function (str) {
  var commaPos = str.indexOf(",");
  return commaPos > 0 ? str.substring(0, commaPos) : str; 
};

var isPlace = function (value) {
  return value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"] &&
    value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"];
};

var addPlace = function (job) {
  var name = utils.extractName(job.key);
  var insert = placeInsert({
    name: name, 
    lat: cleanLatLon(job.value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"][0]),
    lon: cleanLatLon(job.value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"][0]), 
    start_date: "NULL", 
    end_date: "NULL",
    link: utils.escapeQuote(job.link)
  });

  job.log(insert);
  
  return db.runQuery(insert)
    .then(function (result) {
      var id = result.rows[0].id;
      job.value.id = id;
      job.log("got id " + id);
    });
};
var x = 0;

module.exports = function (job) {

  var d = when.defer();

  try {

    job.value = JSON.parse(unescape(job.data.value));

    var shouldProcess = isPlace(job.value);
    job.log("should process as place? " + shouldProcess);
    if (shouldProcess) {
      job.key = unescape(job.data.key);
      job.link = unescape(job.data.link);
      return addPlace(job).then(d.resolve);
    } else {
      d.resolve();
    }

  } catch(e) {
    d.reject(e);
  }

  return d.promise;
};
