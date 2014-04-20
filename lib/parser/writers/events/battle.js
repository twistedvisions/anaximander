var winston = require("winston");
var addEvent = require("../addEvent"),
  addSubType = require("../addSubType"),
  getSubTypes = require("../getSubTypes"),
  when = require("when"),
  utils = require("../../utils");

var shouldProcess = function (value) {
  return !!value["<http://dbpedia.org/ontology/combatant>"] &&
    (value["<http://dbpedia.org/ontology/date>"] ||
       value["<http://dbpedia.org/ontology/year>"]);
};

var process = function (name, job) {
  var deferred = when.defer();
  try {
    var promise = addEvent.addEventWithPlace(name, job,
      "fought", "battle", ["<http://dbpedia.org/ontology/place>"],
      ["<http://dbpedia.org/ontology/date>",
       "<http://dbpedia.org/ontology/year>"]);
    if (promise) {
      promise.then(function () {
        if (job.value.placeId) {
          getSubTypes(job, 3, ["Battle Site"])
            .then(function (subTypes) {
              addSubType(job, job.value.placeId, subTypes)
                .then(function () {
                  deferred.resolve();
                })
                .otherwise(function (e) {
                  if (e && e.detail && e.detail.indexOf("already exists") > -1) {
                    job.log("Already a battle, not adding again");
                    //This happens when multiple battles happened in the same place
                    //Eg: first and second battle of El Alamein
                    winston.info(job.key + "'s place is already a battle, not adding again");
                    deferred.resolve();
                  } else {
                    winston.error("Could not add battle 1", utils.getError(e, job));
                    job.log("rejected add battle1" + JSON.stringify(e));
                    deferred.reject();
                  }
                });
            })
            .otherwise(function (e) {
              winston.error("Could not add battle 2", utils.getError(e, job));
              deferred.reject();
            });
        } else {
          deferred.resolve();
        }
      })
      .otherwise(function (e) {
        winston.error("Could not add battle 3", utils.getError(e, job));
        deferred.reject();
      });
    } else {
      deferred.resolve();
    }

  } catch (e) {
    winston.error("Could not add battle 4", utils.getError(e, job));
    job.log("error");
    job.log(e.message);
    deferred.reject(e);
  }

  return deferred.promise;
};

module.exports = {
  name: "battle",
  shouldProcess: shouldProcess,
  process: process
};