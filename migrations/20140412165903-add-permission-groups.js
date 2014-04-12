/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.createTable.bind(db, "permission_group", {
      id:         {type: "bigint",    primaryKey: true, autoIncrement: true},
      name:       {type: "string",    notNull: false }
    }),

    db.createTable.bind(db, "permission_group_permission", {
      permission_group_id: {type: "bigint", primaryKey: true},
      permission_id:       {type: "bigint", primaryKey: true}
    }),
    db.all.bind(db, ["ALTER TABLE permission_group_permission",
      "ADD CONSTRAINT permission_group_fkey FOREIGN KEY (permission_group_id)",
      "REFERENCES permission_group (id);"].join(" ")),
    db.all.bind(db, ["ALTER TABLE permission_group_permission",
      "ADD CONSTRAINT permission_fkey FOREIGN KEY (permission_id)",
      "REFERENCES permission (id);"].join(" ")),

    db.all.bind(db, "TRUNCATE user_permission"),

    db.all.bind(db, ["ALTER TABLE user_permission",
      "ADD COLUMN permission_group_id bigint NOT NULL",
      "REFERENCES permission_group(id);"].join(" ")),

    db.all.bind(db, "ALTER TABLE user_permission DROP CONSTRAINT permission_fkey;"),

    db.all.bind(db, "ALTER TABLE user_permission DROP COLUMN permission_id;"),

    db.insert.bind(db, "permission_group", ["name"], ["normal"]),

    db.insert.bind(db, "permission_group_permission", ["permission_group_id", "permission_id"], [1, 1]),
    db.insert.bind(db, "permission_group_permission", ["permission_group_id", "permission_id"], [1, 2]),
    db.insert.bind(db, "permission_group_permission", ["permission_group_id", "permission_id"], [1, 3])
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "ALTER TABLE user_permission DROP CONSTRAINT user_permission_permission_group_id_fkey;"),
    db.all.bind(db, "ALTER TABLE user_permission DROP COLUMN permission_group_id;"),
    db.all.bind(db, ["ALTER TABLE user_permission",
      "ADD COLUMN permission_id bigint NOT NULL"].join(" ")),
    db.all.bind(db, ["ALTER TABLE user_permission",
      "ADD CONSTRAINT permission_fkey FOREIGN KEY (permission_id)",
      "REFERENCES permission (id);"].join(" ")),
    db.dropTable.bind(db, "permission_group_permission"),
    db.dropTable.bind(db, "permission_group")
  ];

  async.series(actions, callback);
};
