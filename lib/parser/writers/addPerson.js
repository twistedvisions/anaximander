var when = require("when"),
    _ = require("underscore"),
    winston = require("winston"),
    addThing = require("./addThing"),
    birth = require("./events/birth"),
    death = require("./events/death"),
    getSubTypes = require("./getSubTypes"),
    utils = require("../utils"),
    db = require("../raw_db"),
    thingTypes = require("./thingTypes");

var getSubTypeValues = function (job) {
  var professions = job.value["<http://dbpedia.org/ontology/profession>"];
  job.log("has a profession? " + !!professions);

  if (!!professions) {
    return _.map(professions, function (profession) {
      return utils.extractName(profession);
    });
  }
  return [];
};

var thingExists = _.template(
  "SELECT id FROM thing " +
  "WHERE name = '<%= name %>';"
);


var ifPersonExists = function (job) {
  var d = when.defer();
  var result = thingExists({name: utils.extractName(job.key)});
  db.runQuery(result).then(function (result) {
    d.resolve(result.rows.length > 0 ? result.rows[0].id : null);
  });
  return d.promise;
};

var createPerson = function (job) {

  var shouldProcess = birth.shouldProcess(job.value) ||
    death.shouldProcess(job.value);

  job.log("should create person? " + !!shouldProcess);
  var deferred = when.defer();

  ifPersonExists(job).then(function (thingId) {
    if (thingId) {
      job.value.id = thingId;
      deferred.resolve(job);
    } else {
      if (shouldProcess) {
        getSubTypes(job, 1, getSubTypeValues(job))
          .then(function (subTypes) {
            job.log("got this many subTypes: " + subTypes.length);
            addThing(job, thingTypes.person, subTypes).then(
              function () {
                deferred.resolve(job);
              },
              function (e) {
                winston.error("Could not add person", utils.getError(e, job));
                deferred.reject();
              });
          });
      } else {
        deferred.resolve(null);
      }
    }
  });

  return deferred.promise;
};

module.exports = createPerson;