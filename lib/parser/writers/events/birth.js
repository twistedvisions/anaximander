var addEvent = require("../addEvent");

var wasBorn = function (value) {
  return (!!value["<http://dbpedia.org/ontology/birthDate>"] ||
          !!value["<http://dbpedia.org/ontology/birthYear>"]) &&
      !!value["<http://dbpedia.org/ontology/birthPlace>"];
};

var addBirthday = function (name, job) {
  return addEvent.addEventWithPlace(name, job, "born",
    ["<http://dbpedia.org/ontology/birthPlace>"],
    ["<http://dbpedia.org/ontology/birthDate>",
     "<http://dbpedia.org/ontology/birthYear>"]);
};

module.exports = {
  name: "birth",
  shouldProcess: wasBorn,
  process: addBirthday
};