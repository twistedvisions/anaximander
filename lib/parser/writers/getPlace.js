var _ = require("underscore"),
    winston = require("winston"),
    utils = require("../utils"),
    db = require("../raw_db");

var getPlaceIdQuery = _.template(
  "SELECT id FROM thing WHERE name = '<%= name %>'"
);

var getPlaceIdByName = function (job, name) {
  var query = getPlaceIdQuery({name: name});
  job.log(query);
  return db.runQuery(query)
    .then(
      function (result) {
        return result.rows.length ? result.rows[0].id : null;
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