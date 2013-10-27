var when = require("when"),
    _ = require("underscore"),
    addThing = require("./addThing"),
    birth = require("./events/birth"),
    death = require("./events/death"),
    getSubTypes = require("./getSubTypes"),
    utils = require("../utils"),
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

var createPerson = function (job) {

  var shouldProcess = birth.shouldProcess(job.value) || 
    death.shouldProcess(job.value);

  job.log("should create person? " + !!shouldProcess);
  var deferred = when.defer();
  if (shouldProcess) {
    getSubTypes(job, 1, getSubTypeValues(job))
      .then(function (subTypes) {
        job.log("got this many subTypes: " + subTypes.length);
        addThing(job, thingTypes.person, subTypes).then(
          function () {
            deferred.resolve(job);
          },
          function () {
            deferred.reject();
          });
      });
  } else {
    deferred.resolve(null);
  }
  return deferred.promise;
};

module.exports = createPerson;