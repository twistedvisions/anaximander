var _ = require("underscore");
var when = require("when");
var db = require("../../db");

var parseSubtype = function (row) {
  return {
    type: {
      id: row.thing_type_id
    },
    importance: {
      id: row.importance_id
    }
  };
};


var handleGetThing = function (rows) {
  var thing = _.pick(rows[0], ["id", "name", "link", "type_id", "last_edited"]);
  if (rows[0].thing_type_id) {
    thing.subtypes = _.map(rows, parseSubtype);
  } else {
    thing.subtypes = [];
  }
  return thing;
};

var getThing = function (id) {
  var d = when.defer();

  db.runQuery("get_thing_by_id", [id]).then(
    _.bind(function (result) {
      var rows = result.rows;
      if (rows.length > 0) {
        d.resolve(handleGetThing(rows));
      } else {
        d.reject(new Error("no result"));
      }
    }, this),
    d.reject
  );

  return d.promise;
};

module.exports = getThing;
getThing.handleGetThing = handleGetThing;
