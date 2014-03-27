/*global exports*/

require("db-migrate");
var async = require("async");

//todo: shouldn't be called event change?

exports.up = function (db, callback) {
  var actions = [
    db.createTable.bind(db, "change", {
      id:            {type: "bigint",    primaryKey: true, autoIncrement: true},
      date:          {type: "timestamp", notNull: true,    defaultValue: "now()" },
      user_id:       {type: "bigint",    notNull: true },

      event_id:      {type: "bigint",    notNull: false },
      importance_id: {type: "bigint",    notNull: false },
      place_id:      {type: "bigint",    notNull: false },
      thing_id:      {type: "bigint",    notNull: false },
      type_id:       {type: "bigint",    notNull: false }
    }),
    db.all.bind(db, "ALTER TABLE change ADD COLUMN old json NOT NULL;"),
    db.all.bind(db, "ALTER TABLE change ADD COLUMN new json NOT NULL;")
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [];
  actions.push(db.dropTable.bind(db, "change", callback));
  async.series(actions, callback);
};
