var addEvent = require("../addEvent");

var died = function (value) {
  return (!!value["<http://dbpedia.org/ontology/deathDate>"] ||
          !!value["<http://dbpedia.org/ontology/deathYear>"]) &&
      !!value["<http://dbpedia.org/ontology/deathPlace>"];
};

var addDeathday = function (name, job) {
  return addEvent.addEventWithPlace(name, job, "died",
    ["<http://dbpedia.org/ontology/deathPlace>"], 
    ["<http://dbpedia.org/ontology/deathDate>",
     "<http://dbpedia.org/ontology/deathYear>"]);
};

module.exports = {
  name: "death",
  shouldProcess: died,
  process: addDeathday
};