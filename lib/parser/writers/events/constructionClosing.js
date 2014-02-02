var winston = require("winston");
var addEvent = require("../addEvent"),
  utils = require("../../utils");

var shouldProcess = function (value) {
  return (
      !!value["<http://dbpedia.org/ontology/closingDate>"] ||
      !!value["<http://dbpedia.org/ontology/closingYear>"]
    ) &&

    (
      !!value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"] &&
      !!value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"]
    );
};

var process = function (name, job) {
  try {
    return addEvent.addEventWithPlace(name, job,
      "was opened", "construction closing", null,
      ["<http://dbpedia.org/ontology/closingDate>",
       "<http://dbpedia.org/ontology/closingYear>"]);
  } catch (e) {
    winston.error("Could not add event - constructionClosing",
      utils.getError(e, job));
    job.log("error");
    job.log(e.message);
  }
};

module.exports = {
  name: "opening of a construction",
  shouldProcess: shouldProcess,
  process: process
};