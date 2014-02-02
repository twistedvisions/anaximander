var winston = require("winston");
var addEvent = require("../addEvent"),
  utils = require("../../utils");

var wasFounded = function (value) {
  return (
      !!value["<http://dbpedia.org/ontology/dissolutionDate>"] ||
      !!value["<http://dbpedia.org/ontology/dissolutionYear>"]
    ) &&

    (
      !!value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"] &&
      !!value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"]
    );
};

var addFoundation = function (name, job) {
  try {
    return addEvent.addEventWithPlace(name, job,
      "dissolved as a place", "place dissolution", null,
      ["<http://dbpedia.org/ontology/dissolutionDate>",
       "<http://dbpedia.org/ontology/dissolutionYear>"]);
  } catch (e) {
    winston.error("Could not add event - placeDissolution",
      utils.getError(e, job));
    job.log("error");
    job.log(e.message);
  }
};

module.exports = {
  name: "dissolution of a place",
  shouldProcess: wasFounded,
  process: addFoundation
};