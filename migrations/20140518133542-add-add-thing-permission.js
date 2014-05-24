/*global exports */
require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.insert.bind(db, "permission",
      ["id", "name", "is_global"],
      [9, "add-thing", false]
    ),
    db.insert.bind(db, "permission_group_permission",
      ["permission_group_id", "permission_id"],
      [1, 9]
    )
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "delete from permission_group_permission where permission_group_id = 1 and permission_id = 9;"),
    db.all.bind(db, "delete from permission where name = 'add-thing';")
  ];

  async.series(actions, callback);
};
