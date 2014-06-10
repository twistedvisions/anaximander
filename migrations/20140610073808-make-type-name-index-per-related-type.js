/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "DROP INDEX type_name"),
    db.all.bind(db, [
      "CREATE UNIQUE INDEX type_name",
      "ON type",
      "USING btree",
      "(name COLLATE pg_catalog.\"default\", parent_type_id, related_type_id);"
    ].join(" "))
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "DROP INDEX type_name"),
    db.all.bind(db, [
      "CREATE UNIQUE INDEX type_name",
      "ON type",
      "USING btree",
      "(name COLLATE pg_catalog.\"default\", parent_type_id);"
    ].join(" "))
  ];

  async.series(actions, callback);
};
