/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "UPDATE thing SET type_id = 19 WHERE type_id = 3;")
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  callback();
};
