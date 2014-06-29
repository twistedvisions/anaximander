/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.addColumn.bind(db, "event", "deleted", {
      type: "boolean",
      notNull: true,
      defaultValue: "false"
    }),
    db.insert.bind(db, "permission",
      ["id", "name", "is_global"],
      [10, "delete-event", false]
    ),
    db.insert.bind(db, "permission_group_permission",
      ["permission_group_id", "permission_id"],
      [2, 10]
    ),
    db.insert.bind(db, "permission",
      ["id", "name", "is_global"],
      [11, "delete-ownevent", false]
    ),
    db.insert.bind(db, "permission_group_permission",
      ["permission_group_id", "permission_id"],
      [1, 11]
    )
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.removeColumn.bind(db, "event", "deleted"),
    db.all.bind(db, "DELETE FROM permission_group_permission " +
      "WHERE permission_group_id = 2 AND permission_id = 10"),
    db.all.bind(db, "DELETE FROM permission WHERE id = 10"),
    db.all.bind(db, "DELETE FROM permission_group_permission " +
      "WHERE permission_group_id = 1 AND permission_id = 11"),
    db.all.bind(db, "DELETE FROM permission WHERE id = 11")
  ];
  async.series(actions, callback);
};
