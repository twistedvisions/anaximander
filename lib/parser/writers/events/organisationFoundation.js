var winston = require("winston");
var _ = require("underscore");
var addEvent = require("../addEvent"),
  utils = require("../../utils");

var placeKeys = {
  "<http://dbpedia.org/ontology/locationCity>": true,
  "<http://dbpedia.org/ontology/locationCountry>": true,
  "<http://dbpedia.org/ontology/location>": true,
  "<http://dbpedia.org/ontology/headquarter>": true
};

var locationKeys = {
  "<http://www.w3.org/2003/01/geo/wgs84_pos#lat>": true,
  "<http://www.w3.org/2003/01/geo/wgs84_pos#long>": true
};

var dateKeys = {
  "<http://dbpedia.org/ontology/foundingDate>": true,
  "<http://dbpedia.org/ontology/foundingYear>": true
};

var wasFounded = function (value) {
  
  return (
    !!_.find(placeKeys, function (v, key) {
      return value[key];
    }) && 

    !_.find(locationKeys, function (v, key) {
      return value[key];
    }) &&

    !!_.find(dateKeys, function (v, key) {
      return value[key];
    })
  );
  
};

var addFoundation = function (name, job) {
  try {
    return addEvent.addEventWithPlace(name, job,
      "founded as an organisation", 
      _.keys(placeKeys), 
      _.keys(dateKeys));
  } catch (e) {
    winston.error("Could not add event - organisationFoundation",
      utils.getError(e, job));
    job.log("error");
    job.log(e.message);
  }
};

module.exports = {
  name: "foundation of an organisation",
  shouldProcess: wasFounded,
  process: addFoundation
};