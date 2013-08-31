var _ = require("underscore"),
    db = require("../../db");

var getPlaceIdQuery = _.template(
  "SELECT id FROM place WHERE name = '<%= name %>'"
);

var getPlaceIdByName = function (job, name) {
  var query = getPlaceIdQuery({name: name});
  job.log(query);
  return db.runQuery(query)
    .then(function (result) {
      return result.rows.length ? result.rows[0].id : null;
    });
};

module.exports = {
  byName: getPlaceIdByName
};