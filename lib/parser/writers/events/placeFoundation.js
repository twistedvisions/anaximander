var winston = require("winston");
var addEvent = require("../addEvent"),
  utils = require("../../utils");

var wasFounded = function (value) {
  return (
      !!value["<http://dbpedia.org/ontology/foundingDate>"] ||
      !!value["<http://dbpedia.org/ontology/foundingYear>"]
    ) &&

    (
      !!value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"] &&
      !!value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"]
    );
};

var addFoundation = function (name, job) {
  try {
    return addEvent.addEventWithPlace(name, job,
      "founded as a place", null,
      ["<http://dbpedia.org/ontology/foundingDate>",
       "<http://dbpedia.org/ontology/foundingYear>"]);
  } catch (e) {
    winston.error("Could not add event - placeFoundation",
      utils.getError(e, job));
    job.log("error");
    job.log(e.message);
  }
};

module.exports = {
  name: "foundation of a place",
  shouldProcess: wasFounded,
  process: addFoundation
};