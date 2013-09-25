/*global module, unescape*/
var when = require("when"),
    _ = require("underscore"),
    db = require("../../db"),
    addThing = require("./addThing");


var placeInsert = _.template(
  "INSERT INTO place (thing_id, location) " +
  "VALUES (<%= thing_id %>, ST_PointFromText('POINT(<%= lon %> <%= lat %>)')) " +
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

var addPlaceForThing = function (job, thingId) {
  var insert = placeInsert({
    thing_id: thingId,
    lat: cleanLatLon(job.value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"][0]),
    lon: cleanLatLon(job.value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"][0])
  });

  job.log(insert);

  return db.runQuery(insert).then(
    function (result) {
      var id = result.rows[0].id;
      job.value.id = id;
      job.log("got id " + id);
      return true;
    },
    function (err) {
      job.log(err);
      return false;
    }
  );
};

var addPlace = function (job) {
  var deferred = when.defer();
  job.log("adding thing for place");

  addThing(job, "place", []).then(

    function (thingId) {
      addPlaceForThing(job, thingId)
        .then(
          function () {
            deferred.resolve();
          }, 
          function (e) {
            deferred.reject(e);
          }
        );
    }, 

    function (e) {
      job.log("failed adding thing");
      job.log(e);
      deferred.reject(e);
    }
  );

  return deferred.promise;
};

module.exports = function (job) {

  var d = when.defer();

  try {

    job.value = JSON.parse(unescape(job.data.value));

    var shouldProcess = isPlace(job.value);
    job.log("should process as place? " + !!shouldProcess);
    if (shouldProcess) {
      job.key = unescape(job.data.key);
      job.link = unescape(job.data.link);
      return addPlace(job).then(d.resolve);
    } else {
      d.resolve();
    }

  } catch (e) {
    d.reject(e);
  }

  return d.promise;
};
