var when = require("when"),
    guard = require("when/guard"),
    _ = require("underscore"),
    winston = require("winston"),
    utils = require("../utils"),
    db = require("../raw_db");

var getSubtypeIdQuery = _.template([
  "SELECT id",
  "FROM type",
  "WHERE name = '<%= name %>'"
].join(" "));

var createSubtypeQuery = _.template([
  "INSERT INTO type (name, type_id, parent_type_id)",
  "VALUES ('<%= name %>', 4, <%= type_id %>)",
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
      winston.error("could not create thing type", err);
      return null;
    }
  );
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

  return db.runQuery(getSubtypeIdQuery({name: subTypeName})).then(
    function (result) {
      var id = result.rows.length ? result.rows[0].id : null;
      if (id) {
        job.log("found id " + id + " for subtype " + subTypeName);
        return id;
      } else {
        return createSubType(job, typeId, subTypeName);
      }
    },
    function (e) {
      job.log("could not get thing type for name " + subTypeName);
      job.log(e);
      winston.error("could not get thing type for name " + subTypeName,
        utils.getError(e, job));
      return null;
    }
  );
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