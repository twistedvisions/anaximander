var when = require("when"),
    sequence = require("when/sequence"),
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

var wasFounded = function (value) {
  return value["<http://dbpedia.org/ontology/foundingDate>"] ||
    value["<http://dbpedia.org/ontology/foundingYear>"];
};


var _addEvent = function (name, job, eventName, placeKey, dateKeys) {

  var place;

  if (placeKey) {
    place = job.value[placeKey][0];
  } else {
    place = job.key;
  }
  place = utils.extractName(place);

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

var addFoundation = function (name, job) {
  try {
    return _addEvent(name, job,
      "founded", null, 
      ["<http://dbpedia.org/ontology/foundingDate>",
       "<http://dbpedia.org/ontology/foundingYear>"]);
  } catch (e) {
    job.log("error")
    job.log(e.message)
  }
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
    } catch (e) {
      job.log(e.message);
    }
  });
};

var createPerson = function (job) {
  var shouldProcess = wasBorn(job.value) || died(job.value);
  job.log("should create person? " + shouldProcess);
  if (shouldProcess) {
    job.key = unescape(job.data.key);
    job.link = unescape(job.data.link);
    return addPerson(job);
  } 
};

var processEvents = function (job) {
  try {

    var events = [];
    var name = utils.extractName(job.key);
    
    if (wasBorn(job.value)) {
      job.log("was born");
      events.push(addBirthday(name, job));
    }

    if (died(job.value)) {
      job.log("is dead");
      events.push(addDeathday(name, job));
    }

    if (wasFounded(job.value)) {
      job.log("was founded");
      events.push(addFoundation(name, job));
    }

    return when.all(events);
  } catch (e) {
    job.log(e)
  }


};

module.exports = function (job) {

  var d = when.defer();

  job.value = JSON.parse(unescape(job.data.value));

  job.key = unescape(job.data.key);
  job.link = unescape(job.data.link);
  return sequence(
    [createPerson, processEvents],
    job
  );
};
