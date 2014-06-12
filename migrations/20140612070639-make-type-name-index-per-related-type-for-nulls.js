/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "DROP INDEX type_name"),
    db.all.bind(db, [
      "CREATE UNIQUE INDEX event_type_name",
      "ON type",
      "USING btree",
      "(name COLLATE pg_catalog.\"default\")",
      "WHERE related_type_id IS NULL and related_type_id IS NULL"
    ].join(" ")),
    db.all.bind(db, [
      "CREATE UNIQUE INDEX thing_subtype_name",
      "ON type",
      "USING btree",
      "(name COLLATE pg_catalog.\"default\", parent_type_id)",
      "WHERE related_type_id IS NULL"
    ].join(" ")),
    db.all.bind(db, [
      "CREATE UNIQUE INDEX role_name",
      "ON type",
      "USING btree",
      "(name COLLATE pg_catalog.\"default\", related_type_id)",
      "WHERE parent_type_id IS NULL"
    ].join(" "))
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "DROP INDEX event_type_name"),
    db.all.bind(db, "DROP INDEX thing_subtype_name"),
    db.all.bind(db, "DROP INDEX role_name"),
    db.all.bind(db, [
      "CREATE UNIQUE INDEX type_name",
      "ON type",
      "USING btree",
      "(name COLLATE pg_catalog.\"default\", parent_type_id, related_type_id);"
    ].join(" "))
  ];

  async.series(actions, callback);
};
