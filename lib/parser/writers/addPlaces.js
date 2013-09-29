/*global module, unescape*/
var when = require("when"),
    _ = require("underscore"),
    db = require("../../db"),
    utils = require("../utils"),
    thingTypes = require("./thingTypes"),
    getSubTypes = require("./getSubTypes"),
    addThing = require("./addThing"),
    constructionClosing = require("./events/constructionClosing"),
    constructionCommencement = require("./events/constructionCommencement"),
    constructionOpening = require("./events/constructionOpening"),
    organisationFoundation = require("./events/organisationFoundation"),
    organisationExtinction = require("./events/organisationExtinction"),
    placeFoundation = require("./events/placeFoundation"),
    placeDissolution = require("./events/placeDissolution");


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

var isConstruction = function (job) {
  return constructionClosing.shouldProcess(job.value) ||
    constructionCommencement.shouldProcess(job.value) ||
    constructionOpening.shouldProcess(job.value);
};

var isOrganisation = function (job) {
  return organisationFoundation.shouldProcess(job.value) ||
    organisationExtinction.shouldProcess(job.value);
};

var isActivePlace = function (job) {
  return placeFoundation.shouldProcess(job.value) ||
    placeDissolution.shouldProcess(job.value);
};

var getSubTypeValues = function (job) {
  var subTypes = [];

  var largestCity = job.value["<http://dbpedia.org/ontology/largestCity>"];
  var countySeat = job.value["<http://dbpedia.org/ontology/countySeat>"];
  var anthem = job.value["<http://dbpedia.org/ontology/anthem>"];
  job.log("contains a city? " + !!(largestCity || countySeat));
  job.log("has an anthem? " + !!anthem);

  if (!!(largestCity || countySeat)) {
    subTypes.push("Subdivision");
  } else if (!!anthem) {
    subTypes.push("Country");
  } else if (!isConstruction(job) || isOrganisation(job)) {
    subTypes.push("Settlement");
  }

  if (isActivePlace(job) || isConstruction(job)) {
    var types = job.value["<http://dbpedia.org/ontology/type>"];
    _.forEach(types, function (type) {
      subTypes.push(utils.extractName(type));
    });
  }

  return subTypes;
};

var addPlace = function (job) {
  var deferred = when.defer();
  job.log("adding thing for place");

  var typeId;
  if (isConstruction(job)) {
    typeId = thingTypes.construction;
  } else if (isOrganisation(job)) {
    typeId = thingTypes.organisation;
  } else {
    typeId = thingTypes.place;
  }

  if (job.key.indexOf("Auckland")>=0){

    console.log(job.key, typeId, JSON.stringify(job.value))
  }

  getSubTypes(job, typeId, getSubTypeValues(job))
    .then(function (subTypes) {

      addThing(job, typeId, subTypes).then(

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
