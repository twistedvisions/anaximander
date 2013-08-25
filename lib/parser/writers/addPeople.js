var when = require("when"),
    guard = require("when/guard"),
    _ = require("underscore"),
    db = require("../../db"),
    utils = require("../utils"),
    config = require("../config"),
    addEvent = require("./addEvent");

module.exports = function (data) {

  var personInsert = _.template(
    "INSERT INTO person (name, link) " +
    "VALUES ('<%= name %>', '<%= link %>') " +
    "RETURNING id"
  );

  var addPerson = function (key, value) {

    var name = utils.extractName(key);
    var insert = personInsert({
      name: name,
      link: utils.escapeQuote(value.link)
    });
   
    return db.runQuery(insert).then(function (result) {
      value.id = result.rows[0].id;
      var events = [];
      var p;
      if (wasBorn(value)) {
        p = addBirthday(data, name, value);
        if (p) {
          events.push(p);
        }
      }
      if (died(value)) {
        events.push(addDeathday(data, name, value));
      }
      return when.all(events);
    });
  };

  var addBirthday = function (data, name, value) {
    return addEvent.addEvent(data, name, value, "born",
      "<http://dbpedia.org/ontology/birthPlace>", 
      "<http://dbpedia.org/ontology/birthDate>");
  };
  var addDeathday = function (data, name, value) {
    return addEvent.addEvent(data, name, value, "died",
      "<http://dbpedia.org/ontology/deathPlace>", 
      "<http://dbpedia.org/ontology/deathDate>");
  };
  
  var wasBorn = function (value) {
    return value["<http://dbpedia.org/ontology/birthDate>"] &&
        value["<http://dbpedia.org/ontology/birthPlace>"];
  };

  var died = function (value) {
    return value["<http://dbpedia.org/ontology/deathDate>"] &&
        value["<http://dbpedia.org/ontology/deathPlace>"];
  };

  var counter = 0;

  return when.map(_.pairs(data), guard(guard.n(config.parallelism), function (pair) {
    counter += 1;
    if (counter % 1000 === 0) {
      console.log(counter);
    }
    var key = pair[0];
    var value = pair[1];

    if (wasBorn(value) || died(value)) {
      return addPerson(key, value);
    }
  })).otherwise(
    function (e) {
      console.log("failed adding people", e);
    }
  );
};
