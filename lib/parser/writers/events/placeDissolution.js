var addEvent = require("../addEvent");

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
      "dissolved as a place", null, 
      ["<http://dbpedia.org/ontology/dissolutionDate>",
       "<http://dbpedia.org/ontology/dissolutionYear>"]);
  } catch (e) {
    job.log("error");
    job.log(e.message);
  }
};

module.exports = {
  name: "dissolution of a place",
  shouldProcess: wasFounded,
  process: addFoundation
};