var _ = require("underscore"),
    winston = require("winston"),
    utils = require("../utils"),
    db = require("../raw_db");

var getPlaceIdQuery = _.template(
  [
    "SELECT t.id, normal_offset as offset",
    "FROM thing t",
    "INNER JOIN place p ON p.thing_id = t.id",
    "INNER JOIN timezone tz ON ST_Within(p.location, tz.geom)",
    "WHERE name = '<%= name %>' "
  ].join(" ")
);

var getPlaceIdByName = function (job, name) {
  var query = getPlaceIdQuery({name: name});
  job.log(query);
  return db.runQuery(query)
    .then(
      function (result) {
        return result.rows.length ? result.rows[0] : null;
      },
      function (e) {
        job.log("could not get place name");
        job.log(e);
        winston.error("could not get place name", utils.getError(e, job));

        return null;
      }
    );
};

module.exports = {
  byName: getPlaceIdByName
};