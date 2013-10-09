var addEvent = require("../addEvent"),
  addSubType = require("../addSubType"),
  getSubTypes = require("../getSubTypes"),
  when = require("when");

var shouldProcess = function (value) {
  return !!value["<http://dbpedia.org/ontology/combatant>"] && 
    (value["<http://dbpedia.org/ontology/date>"] ||
       value["<http://dbpedia.org/ontology/year>"]);
};

var process = function (name, job) {
  var deferred = when.defer();
  try {
    var promise = addEvent.addEventWithPlace(name, job,
      "fought", ["<http://dbpedia.org/ontology/place>"], 
      ["<http://dbpedia.org/ontology/date>",
       "<http://dbpedia.org/ontology/year>"]);
    promise
      .then(function () {
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
                    deferred.resolve();
                  } else {
                    job.log("rejected add battle1" + JSON.stringify(e));
                    deferred.reject();
                  }
                });
            })
            .otherwise(function () {
              deferred.reject();
            });
        } else {
          deferred.resolve();
        }
      })
      .otherwise(function () {
        deferred.reject();
      });
  } catch (e) {
    job.log("error");
    job.log(e.message);
  }
  deferred.resolve();
  return deferred.promise;
};

module.exports = {
  name: "battle",
  shouldProcess: shouldProcess,
  process: process
};