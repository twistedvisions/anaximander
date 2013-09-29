var when = require("when"),
    guard = require("when/guard"),
    _ = require("underscore"),
    db = require("../../db");

var getSubtypeIdQuery = _.template([
  "SELECT id",
  "FROM thing_type",
  "WHERE name = '<%= name %>'"
].join(" "));

var createSubtypeQuery = _.template([
  "INSERT INTO thing_type (name, parent_type)",
  "VALUES ('<%= name %>', <%= type_id %>)",
  "RETURNING id"
].join(" "));

var createSubType = function (job, typeId, name) {
  var query = createSubtypeQuery({
    name: name,
    type_id: typeId
  });
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

var getSubType = function (job, typeId, p) {

  job.log("looking for profession " + p);
  return db.runQuery(getSubtypeIdQuery({name: p})).then(
    function (result) {
      var id = result.rows.length ? result.rows[0].id : null;
      if (id) {
        job.log("found id " + id + " for profession " + p);
        return id;
      } else {
        return createSubType(job, typeId, p);
      }
    },
    function (err) {
      job.log("could not get thing type for name " + p);
      job.log(err);
      return null;
    }
  );
};

var getSubTypes = function (job, typeId, values) {
  var deferred = when.defer();

  if (values && values.length > 0) {
    var results = _.map(values, guard(guard.n(1), function (value) {
      return getSubType(job, typeId, value);
    }));
    deferred.resolve(when.all(results));
  } else {
    deferred.resolve([]);
  }
  return deferred.promise;
};

module.exports = getSubTypes;