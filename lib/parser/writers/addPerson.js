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
  "INSERT INTO thing_type (name)",
  "VALUES ('<%= name %>')",
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

var getSubType = function (job) {

  var deferred = when.defer();

  var profession = job.value["<http://dbpedia.org/ontology/profession>"];
  job.log("has a profession? " + !!profession);

  if (!!profession) {
    //todo: handle many processions
    var p = utils.extractName(profession[0]);
    job.log("looking for profession " + p);
    return db.runQuery(getSubtypeIdQuery({name: p})).then(
      function (result) {
        var id = result.rows.length ? result.rows[0].id : null;
        if (id) {
          job.log("found id " + id + " for profession " + p);
          deferred.resolve(id);
        } else {
          deferred.resolve(createSubType(job, p));
        }
      },
      function (err) {
        job.log("could not get thing type for name " + p);
        job.log(err);
        deferred.reject(err);
      }
    );

  } else {
    deferred.resolve(null);
  }
  return deferred.promise;

};

var createPerson = function (job) {

  var shouldProcess = birth.shouldProcess(job.value) || 
    death.shouldProcess(job.value);

  job.log("should create person? " + !!shouldProcess);

  if (shouldProcess) {

    getSubType(job)
      .then(function (subType) {
        job.log("got subType " + subType);
        return addThing(job, "person", subType ? [subType] : null);
      })
      .otherwise(function () {
        return addThing(job, "person", []);
      });

  } 
};

module.exports = createPerson;