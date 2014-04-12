var when = require("when"),
    guard = require("when/guard"),
    _ = require("underscore"),
    winston = require("winston"),
    utils = require("../utils"),
    lock = require("../acquireLock"),
    db = require("../raw_db");

lock.start();

var getSubtypeIdQuery = _.template([
  "SELECT id",
  "FROM type",
  "WHERE name = '<%= name %>'"
].join(" "));

var createSubtypeQuery = _.template([
  "INSERT INTO type (name, type_id, parent_type_id, creator_id)",
  "VALUES ('<%= name %>', 4, <%= type_id %>, 1)",
  "RETURNING id"
].join(" "));

var createImportanceQuery = _.template([
  "INSERT INTO importance (name, description, value, type_id, creator_id)",
  "VALUES ('nominal', '<%= description %>', 5, <%= type_id %>, 1)",
  "RETURNING id"
].join(" "));

var setDefaultImportanceQuery = _.template([
  "UPDATE type SET default_importance_id = <%= importance_id %> ",
  "WHERE id = <%= type_id %>"
].join(" "));

var setDefaultImportance = function (job, typeId, importanceId) {
  var d = when.defer();
  var query = setDefaultImportanceQuery({
    type_id: typeId,
    importance_id: importanceId
  });
  job.log(query);
  db.runQuery(query).then(
    function (/*result*/) {
      job.log("set default importance for " + typeId + " as " + importanceId);
      d.resolve();
    },
    function (err) {
      job.log("could not set default importance");
      job.log(err);
      winston.error("could not set default importance", err);
      d.resolve();
    }
  );
  return d.promise;
};

var createImportance = function (job, name, typeId) {
  var d = when.defer();
  var query = createImportanceQuery({
    description: "a default value of importance for " + name,
    type_id: typeId
  });
  job.log(query);
  db.runQuery(query).then(
    function (result) {
      var id = result.rows.length ? result.rows[0].id : null;
      if (id) {
        job.log("created importance for " + name + " with id " + id);
        setDefaultImportance(job, typeId, id).then(function () {
          d.resolve();
        });
      } else {
        job.log("could not create an importance ... odd!");
        d.resolve();
      }
    },
    function (err) {
      job.log("could not create importance");
      job.log(err);
      winston.error("could not create importance", err);
      d.resolve();
    }
  );
  return d.promise;
};

var createSubType = function (job, typeId, name) {
  var d = when.defer();

  var query = createSubtypeQuery({
    name: name,
    type_id: typeId
  });
  job.log(query);
  db.runQuery(query).then(
    function (result) {
      var id = result.rows.length ? result.rows[0].id : null;
      if (id) {
        job.log("created type for " + name + " with id " + id);
        createImportance(job, name, id).then(function () {
          d.resolve(id);
        });
      } else {
        job.log("could not create a subtype ... odd!");
        d.resolve();
      }
    },
    function (err) {
      job.log("could not create thing type");
      job.log(err);
      winston.error("could not create thing type", err);
      d.resolve();
    }
  );

  return d.promise;
};

var lookups = require("../../../config/subtype_lookups.json");

var regexes = require("../../../config/subtype_regexes.json");

var lookupSubTypeName = function (typeId, name) {

  var hasRegexMatch = function (typeId, name) {
    var potentials = regexes[typeId];
    if (!potentials) {
      return false;
    }
    var match = _.find(_.pairs(potentials), function (potential) {
      return _.any(potential[1], function (regex) {
          return new RegExp(regex, "i").test(name);
        });
    });
    if (match) {
      return match[0];
    }
  };
  var regexMatch;

  name = name.replace("''", "'");

  if (lookups[typeId] && lookups[typeId][name] !== undefined) {
    return lookups[typeId][name];
  } else {
    regexMatch = hasRegexMatch(typeId, name);
    if (regexMatch) {
      return regexMatch;
    }
  }
  return name;
};

var getSubType = function (job, typeId, subTypeName) {
  var d = when.defer();

  var lockName = typeId.toString() + "_" + subTypeName;
  winston.debug("get lock " + lockName);

  lock.acquireLock(lockName).then(function (releaseLock) {
    winston.debug("got lock " + lockName);
    d.promise.then(function () {
      winston.debug("release lock " + lockName);
      releaseLock();
    });

    db.runQuery(getSubtypeIdQuery({name: subTypeName})).then(
      function (result) {
        var id = result.rows.length ? result.rows[0].id : null;
        if (id) {
          job.log("found id " + id + " for subtype " + subTypeName);
          d.resolve(id);
        } else {
          createSubType(job, typeId, subTypeName).then(function (typeId) {
            d.resolve(typeId);
          });
        }
      },
      function (e) {
        job.log("could not get thing type for name " + subTypeName);
        job.log(e);
        winston.error("could not get thing type for name " + subTypeName,
          utils.getError(e, job));
        d.resolve();
      }
    );

  });

  return d.promise;
};

var getSubTypes = function (job, typeId, values) {
  var deferred = when.defer();

  if (values && values.length > 0) {

    values = _.map(values, function (value) {
      return lookupSubTypeName(typeId, value);
    });
    values = _.filter(values, function (value) {
      return !!value;
    });

    var results = _.map(_.uniq(values), guard(guard.n(1), function (value) {
      return getSubType(job, typeId, value);
    }));

    deferred.resolve(when.all(results));
  } else {
    deferred.resolve([]);
  }
  return deferred.promise;
};

module.exports = getSubTypes;