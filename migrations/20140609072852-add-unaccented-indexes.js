/*global exports*/

require("db-migrate");
var async = require("async");

//see: http://stackoverflow.com/questions/11005036/does-postgresql-support-accent-insensitive-collations

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "CREATE EXTENSION unaccent;"),
    db.all.bind(db, "DROP INDEX thing_name_gin;"),
    db.all.bind(db,
      [
        "CREATE OR REPLACE FUNCTION f_unaccent(text)",
        "RETURNS text AS",
        "$func$",
        "SELECT unaccent('unaccent', $1)",
        "$func$  LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp;"
      ].join(" ")
    ),
    db.all.bind(db, "CREATE INDEX thing_name_gin ON thing " +
      "USING gin (lower(f_unaccent(name)) COLLATE pg_catalog.\"default\" gin_trgm_ops);")
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "DROP INDEX thing_name_gin;"),
    db.all.bind(db, "DROP FUNCTION f_unaccent(text);"),
    db.all.bind(db, "DROP EXTENSION IF EXISTS unaccent;"),
    db.all.bind(db, "CREATE INDEX thing_name_gin ON thing " +
      "USING gin (name COLLATE pg_catalog.\"default\" gin_trgm_ops);")
  ];

  async.series(actions, callback);
};
