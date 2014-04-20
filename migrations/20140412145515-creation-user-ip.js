/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "ALTER TABLE creator ADD COLUMN user_ip cidr NOT NULL DEFAULT '0.0.0.0'")
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "ALTER TABLE creator DROP COLUMN user_ip;")
  ];

  async.series(actions, callback);
};
