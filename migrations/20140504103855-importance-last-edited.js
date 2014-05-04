/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "ALTER TABLE importance ADD COLUMN last_edited timestamp NOT NULL DEFAULT now();")
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "ALTER TABLE importance DROP COLUMN last_edited;")
  ];

  async.series(actions, callback);
};
