/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "ALTER TABLE timezone ADD COLUMN normal_offset numeric;"),
    db.all.bind(db, "ALTER TABLE timezone ADD COLUMN ds_offset numeric;")
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "ALTER TABLE timezone REMOVE COLUMN normal_offset;"),
    db.all.bind(db, "ALTER TABLE timezone REMOVE COLUMN ds_offset;")
  ];

  async.series(actions, callback);
};
