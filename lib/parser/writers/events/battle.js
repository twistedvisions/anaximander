var addEvent = require("../addEvent");

var shouldProcess = function (value) {
  return !!value["<http://dbpedia.org/ontology/combatant>"];
};

var process = function (name, job) {
  try {
    return addEvent.addEventWithPlace(name, job,
      "fought", "<http://dbpedia.org/ontology/place>", 
      ["<http://dbpedia.org/ontology/date>",
       "<http://dbpedia.org/ontology/year>"]);
  } catch (e) {
    job.log("error");
    job.log(e.message);
  }
};

module.exports = {
  name: "battle",
  shouldProcess: shouldProcess,
  process: process
};