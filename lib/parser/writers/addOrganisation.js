var when = require("when"),
    _ = require("underscore"),
    addThing = require("./addThing"),
    organisationFoundation = require("./events/organisationFoundation"),
    getSubTypes = require("./getSubTypes"),
    utils = require("../utils");


var getSubTypeValues = function (job) {

  var values = [];

  var industries = job.value["<http://dbpedia.org/ontology/industry>"];
  job.log("has a industry? " + !!industries);

  if (!!industries) {
    values = values.concat(_.map(industries, function (industry) {
      return "Business - " + utils.extractName(industry);
    }));
  }

  var types = job.value["<http://dbpedia.org/ontology/type>"];
  job.log("has a type? " + !!types);

  if (!!types) {
    var typeKeys = {
      "<http://dbpedia.org/resource/Public_company>": 1,
      "<http://dbpedia.org/resource/Private_company_limited_by_shares>": 1,
      "<http://dbpedia.org/resource/Public_limited_company>": 1,
      "<http://dbpedia.org/resource/Privately_held_company>": 1,
      "<http://dbpedia.org/resource/Limited_liability_company>": 1,
      "<http://dbpedia.org/resource/Joint-stock_company>": 1,
      "<http://dbpedia.org/resource/Division_(business)>": 1,
      "<http://dbpedia.org/resource/Unlimited_company>": 1,
      "<http://dbpedia.org/resource/Subsidiary>": 1
    };
    values = values.concat(
      _(types)
        .filter(function (type) {
          if (typeKeys[type]) {
            return true;
          }
          return false;
        })
        .map(function (type) {
          return utils.extractName(type);
        })
    );
  }

  return values;
};

var createOrganisation = function (job) {

  var shouldProcess = organisationFoundation.shouldProcess(job.value);

  job.log("should create organisation? " + !!shouldProcess);
  var deferred = when.defer();
  if (shouldProcess) {
    getSubTypes(job, 2, getSubTypeValues(job))
      .then(function (subTypes) {
        job.log("got this many subTypes: " + subTypes.length);
        addThing(job, "organisation", subTypes).then(
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

module.exports = createOrganisation;