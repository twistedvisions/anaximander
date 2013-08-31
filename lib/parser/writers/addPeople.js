var when = require("when"),
    guard = require("when/guard"),
    _ = require("underscore"),
    db = require("../../db"),
    utils = require("../utils"),
    config = require("../config"),
    addEvent = require("./addEvent"),
    getPlace = require("./getPlace");

var personInsert = _.template(
  "INSERT INTO person (name, link) " +
  "VALUES ('<%= name %>', '<%= link %>') " +
  "RETURNING id"
);

var wasBorn = function (value) {
  return (value["<http://dbpedia.org/ontology/birthDate>"] ||
          value["<http://dbpedia.org/ontology/birthYear>"]) &&
      value["<http://dbpedia.org/ontology/birthPlace>"];
};

var died = function (value) {
  return (value["<http://dbpedia.org/ontology/deathDate>"] ||
          value["<http://dbpedia.org/ontology/deathYear>"]) &&
      value["<http://dbpedia.org/ontology/deathPlace>"];
};

var _addEvent = function (name, job, eventName, placeKey, dateKeys) {

  var place = utils.extractName(job.value[placeKey][0]);
  job.log("looking for " + place);
  return getPlace.byName(job, place).then(function (placeId) {
    if (placeId) {
      return addEvent.addEvent(name, job, eventName, placeId, dateKeys);
    } else {
      job.log("Can't find place, skipping");
    }
  });
};

var addBirthday = function (name, job) {
  return _addEvent(name, job, "born",
    "<http://dbpedia.org/ontology/birthPlace>", 
    ["<http://dbpedia.org/ontology/birthDate>",
     "<http://dbpedia.org/ontology/birthYear>"]);
};
var addDeathday = function (name, job) {
  return _addEvent(name, job, "died",
    "<http://dbpedia.org/ontology/deathPlace>", 
    ["<http://dbpedia.org/ontology/deathDate>",
     "<http://dbpedia.org/ontology/deathYear>"]);
};

var addPerson = function (job) {
  
  var name = utils.extractName(job.key);
  var insert = personInsert({
    name: name,
    link: utils.escapeQuote(job.link)
  });
  job.log(insert);
  return db.runQuery(insert).then(function (result) {
    job.log("got id? ");
    try {
      job.value.id = result.rows[0].id;
      var events = [];
      var p;
      if (wasBorn(job.value)) {
        job.log("was born");
        p = addBirthday(name, job);
        if (p) {
          events.push(p);
        }
      }
      if (died(job.value)) {
        job.log("is dead");
        events.push(addDeathday(name, job));
      }
      return when.all(events);
    } catch (e) {
      job.log(e.message);
    }
  });
};

module.exports = function (job) {

  var d = when.defer();

  job.value = JSON.parse(unescape(job.data.value));

  var shouldProcess = wasBorn(job.value) || died(job.value);
  job.log("should process as person? " + shouldProcess);
  if (shouldProcess) {
    job.key = unescape(job.data.key);
    job.link = unescape(job.data.link);
    return addPerson(job).then(d.resolve);
  } else {
    d.resolve();
  }
  return d.promise;
};
