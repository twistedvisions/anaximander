/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, [
      "UPDATE importance",
      "SET value = 2",
      "WHERE name = 'nominal'"
    ].join(" "))
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, [
      "UPDATE importance",
      "SET value = 5",
      "WHERE name = 'nominal'"
    ].join(" "))
  ];

  async.series(actions, callback);
};
