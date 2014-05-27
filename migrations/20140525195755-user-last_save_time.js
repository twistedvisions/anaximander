/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "ALTER TABLE registered_user ADD COLUMN last_save_time timestamp NOT NULL DEFAULT now();")
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "ALTER TABLE registered_user DROP COLUMN last_save_time;")
  ];

  async.series(actions, callback);
};
