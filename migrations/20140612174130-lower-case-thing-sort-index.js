/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "DROP INDEX thing_name_idx"),
    db.all.bind(db, [
      "CREATE INDEX thing_name_idx",
      "ON thing",
      "USING btree",
      "(lower(f_unaccent(name)) COLLATE pg_catalog.\"default\");"
    ].join(" "))
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "DROP INDEX thing_name_idx"),
    db.all.bind(db, [
      "CREATE INDEX thing_name_idx",
      "ON thing",
      "USING btree",
      "(name COLLATE pg_catalog.\"default\");"
    ].join(" "))
  ];

  async.series(actions, callback);
};
