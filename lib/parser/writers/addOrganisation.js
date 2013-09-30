var when = require("when"),
    _ = require("underscore"),
    addThing = require("./addThing"),
    organisationFoundation = require("./events/organisationFoundation"),
    getSubTypes = require("./getSubTypes"),
    utils = require("../utils"),
    thingTypes = require("./thingTypes");


var getSubTypeValues = function (job) {

  var values = [];

  var industries = job.value["<http://dbpedia.org/ontology/industry>"];
  job.log("has an industry? " + !!industries);

  if (!!industries) {
    values = values.concat(_.map(industries, function (industry) {
      return "Business - " + utils.extractName(industry);
    }));
  }

  var circulation = job.value["<http://dbpedia.org/ontology/circulation>"];
  if (!!circulation) {
    job.log("has circulation - is a newspaper");
    values.push("Business - Newspaper");
  }


  var products = job.value["<http://dbpedia.org/ontology/product>"];
  job.log("has a product? " + !!products);

  if (!!products) {
    values = values.concat(_.map(products, function (product) {
      return "Product - " + utils.extractName(product);
    }));
  }

  var types = job.value["<http://dbpedia.org/ontology/type>"];

  job.log("has a type? " + !!types);

  if (!!types) {
    var typeKeys = {
      "<http://dbpedia.org/resource/Public_company>": 1,
      "<http://dbpedia.org/resource/Limited_company>": 1,
      "<http://dbpedia.org/resource/Private_company_limited_by_shares>": 1,
      "<http://dbpedia.org/resource/Public_limited_company>": 1,
      "<http://dbpedia.org/resource/Privately_held_company>": 1,
      "<http://dbpedia.org/resource/Limited_liability_company>": 1,
      "<http://dbpedia.org/resource/Limited_liability_partnership>": 1,
      "<http://dbpedia.org/resource/Joint-stock_company>": 1,
      "<http://dbpedia.org/resource/Division_(business)>": 1,
      "<http://dbpedia.org/resource/Unlimited_company>": 1,
      "<http://dbpedia.org/resource/Subsidiary>": 1,
      "<http://dbpedia.org/resource/Kabushiki_gaisha>": 1,
      "<http://dbpedia.org/resource/Nonprofit_organization>": 1,
      "<http://dbpedia.org/resource/Government-owned_corporation>": 1,
      "<http://dbpedia.org/resource/Public-benefit_corporation>": 1,
      "<http://dbpedia.org/resource/Nationalization>": 1,
      "<http://dbpedia.org/resource/General_partnership>": 1,
      "<http://dbpedia.org/resource/Corporation>": 1,
      "<http://dbpedia.org/resource/Government_agency>": 1
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

    var businessTypeKeys = {
      "<http://dbpedia.org/resource/Newspaper>": 1,
      "<http://dbpedia.org/resource/Online_newspaper>": 1,
      "<http://dbpedia.org/resource/Alternative_newspaper>": 1,
      "<http://dbpedia.org/resource/News_agency>": 1,
      "<http://dbpedia.org/resource/Student_newspaper>": 1
    };
    values = values.concat(
       _(types)
        .filter(function (type) {
          if (businessTypeKeys[type]) {
            return true;
          } 
          return false;
        })
        .map(function (type) {
          return "Business - " + utils.extractName(type);
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
        addThing(job, thingTypes.organisation, subTypes).then(
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
