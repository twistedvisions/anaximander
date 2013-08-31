var addEvent = require("../addEvent");

var wasFounded = function (value) {
  return value["<http://dbpedia.org/ontology/foundingDate>"] ||
    value["<http://dbpedia.org/ontology/foundingYear>"];
};

var addFoundation = function (name, job) {
  try {
    return addEvent.addEventWithPlace(name, job,
      "founded", null, 
      ["<http://dbpedia.org/ontology/foundingDate>",
       "<http://dbpedia.org/ontology/foundingYear>"]);
  } catch (e) {
    job.log("error");
    job.log(e.message);
  }
};

module.exports = {
  name: "foundation",
  shouldProcess: wasFounded,
  process: addFoundation
};