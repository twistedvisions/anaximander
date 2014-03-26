/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.createTable.bind(db, "creator", {
      id:      {type: "bigint",       primaryKey: true, autoIncrement: true},
      date:    {type: "timestamp", notNull: true, defaultValue: "now()" },
      user_id: {type: "bigint",    notNull: true }
    })
  ];

  actions.push(db.insert.bind(db, "registered_user",
    ["username"],
    ["anaximander"]));
  actions.push(db.insert.bind(db, "creator", ["user_id"], [1]));

  ["thing", "event", "type", "importance", "event_participant"].forEach(function (tableName) {

    actions.push(db.addColumn.bind(db, tableName, "creator_id", {
      type: "bigint",
      notNull: false
    }));
    actions.push(db.all.bind(db, "UPDATE " + tableName + " SET creator_id = 1;"));
    actions.push(db.all.bind(db, "ALTER TABLE " + tableName + " " +
      "ADD CONSTRAINT creator_fkey FOREIGN KEY (creator_id) " +
      "REFERENCES creator (id) MATCH FULL;"));
    actions.push(db.changeColumn.bind(db, tableName, "creator_id", {
      notNull: true
    }));
  });

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [];
  ["thing", "event", "type", "importance"].forEach(function (tableName) {
    actions.push(db.dropColumn.bind(db, tableName, "creator_id", callback));
  });
  actions.push(db.dropTable.bind(db, "creator", callback));
  async.series(actions, callback);
};
