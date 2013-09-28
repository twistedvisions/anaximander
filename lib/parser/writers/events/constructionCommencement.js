var addEvent = require("../addEvent");

var shouldProcess = function (value) {
  return (
      !!value["<http://dbpedia.org/ontology/buildingStartDate>"] ||
      !!value["<http://dbpedia.org/ontology/buildingStartYear>"]
    ) && 
  
    (
      !!value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"] &&
      !!value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"]
    );
};

var process = function (name, job) {
  try {
    return addEvent.addEventWithPlace(name, job,
      "construction was started", null, 
      ["<http://dbpedia.org/ontology/buildingStartDate>",
       "<http://dbpedia.org/ontology/buildingStartYear>"]);
  } catch (e) {
    job.log("error");
    job.log(e.message);
  }
};

module.exports = {
  name: "construction was started",
  shouldProcess: shouldProcess,
  process: process
};