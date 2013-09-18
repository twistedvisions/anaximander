var _ = require("underscore"),
    addThing = require("./addThing"),
    birth = require("./events/birth"),
    death = require("./events/death"),
    db = require("../../db"),
    utils = require("../utils"),
    when = require("when");

var getSubtypeIdQuery = _.template([
  "SELECT id",
  "FROM thing_type",
  "WHERE name = '<%= name %>'"
].join(" "));

var createSubtypeQuery = _.template([
  "INSERT INTO thing_type (name, parent_type)",
  "VALUES ('<%= name %>', 1)",
  "RETURNING id"
].join(" "));

var createSubType = function (job, name) {
  var query = createSubtypeQuery({name: name});
  job.log(query);
  return db.runQuery(query).then(
    function (result) {
      var id = result.rows.length ? result.rows[0].id : null;
      if (id) {
        job.log("created type for " + name + " with id " + id);
        return id;
      } else {
        job.log("could not create a subtype ... odd!");
        return null;
      }
    },
    function (err) {
      job.log("could not create thing type");
      job.log(err);
      return null;
    }
  );
};

var getSubType = function (job, p) {

  job.log("looking for profession " + p);
  return db.runQuery(getSubtypeIdQuery({name: p})).then(
    function (result) {
      var id = result.rows.length ? result.rows[0].id : null;
      if (id) {
        job.log("found id " + id + " for profession " + p);
        return id;
      } else {
        return createSubType(job, p);
      }
    },
    function (err) {
      job.log("could not get thing type for name " + p);
      job.log(err);
      return null;
    }
  );
};

var getSubTypes = function (job) {
  var deferred = when.defer();

  var professions = job.value["<http://dbpedia.org/ontology/profession>"];
  job.log("has a profession? " + !!professions);

  if (!!professions) {
    var results = _.map(professions, function (profession) {
      profession = utils.extractName(profession);
      return getSubType(job, profession);
    });
    deferred.resolve(when.all(results));
  } else {
    deferred.resolve([]);
  }
  return deferred.promise;
};

var createPerson = function (job) {

  var shouldProcess = birth.shouldProcess(job.value) || 
    death.shouldProcess(job.value);

  job.log("should create person? " + !!shouldProcess);
  var deferred = when.defer();
  if (shouldProcess) {
    getSubTypes(job)
      .then(function (subTypes) {
        job.log("got this many subTypes: " + subTypes.length);
        addThing(job, "person", subTypes).then(
          function () {
            deferred.resolve(job);
          },
          function () {
            deferred.reject();
          });
      })
      .otherwise(function () {
        addThing(job, "person", []).then(
          function () {
            deferred.resolve(job);
          },
          function (err) {
            deferred.reject(err);
          });
      });
  } else {
    deferred.resolve(null);
  }
  return deferred.promise;
};

module.exports = createPerson;