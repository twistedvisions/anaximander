/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "INSERT INTO permission_group (id, name) VALUES (2, 'admin')"),
    db.all.bind(db, [
      "INSERT INTO permission_group_permission (permission_group_id, permission_id) VALUES",
      "  (2, 1),",
      "  (2, 2),",
      "  (2, 3),",
      "  (2, 4),",
      "  (2, 5),",
      "  (2, 6),",
      "  (2, 7),",
      "  (2, 8),",
      "  (2, 9)"
    ].join(" ")),
    db.all.bind(db, "UPDATE user_permission SET permission_group_id = 2 WHERE user_id = 2;"),
    db.all.bind(db, [
      "DELETE FROM permission_group_permission",
      "WHERE permission_group_id = 1",
      "AND (permission_id = 5 OR permission_id = 6)"
    ].join(" "))
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, [
      "INSERT INTO permission_group_permission (permission_group_id, permission_id) VALUES",
      "  (1, 5),",
      "  (1, 6)"
    ].join(" ")),
    db.all.bind(db, "DELETE FROM user_permission WHERE permission_group_id = 2;"),
    db.all.bind(db, [
      "DELETE FROM permission_group_permission",
      "WHERE permission_group_id = 2"
    ].join(" ")),
    db.all.bind(db, "DELETE FROM permission_group WHERE id = 2"),
  ];

  async.series(actions, callback);
};
