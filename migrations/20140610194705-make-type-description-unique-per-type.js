/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "ALTER TABLE importance DROP CONSTRAINT importance_description_key;"),
    db.all.bind(db, [
      "CREATE UNIQUE INDEX importance_description",
      "ON importance",
      "USING btree",
      "(description COLLATE pg_catalog.\"default\", type_id);"
    ].join(" "))
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "DROP INDEX importance_description"),
    db.all.bind(db, [
      "ALTER TABLE importance",
      "ADD CONSTRAINT importance_description_key UNIQUE(description);"
    ].join(" "))
  ];

  async.series(actions, callback);
};
