/*global exports*/
// var dbm = require("db-migrate");
require("db-migrate");
var async = require("async");
// var type = dbm.dataType;

exports.up = function (db, callback) {
  async.series([
    db.createTable.bind(db, "registered_user", {
      id:            {type: "int",     primaryKey: true, autoIncrement: true},
      username:      {type: "string",  notNull: false, unique: true },
      password:      {type: "string",  notNull: false },
      facebook_id:   {type: "string",  notNull: false },
      google_id:     {type: "string",  notNull: false },
      twitter_id:    {type: "string",  notNull: false },
      github_id:     {type: "string",  notNull: false },
      email:         {type: "string",  notNull: false, unique: true },
      name:          {type: "string",  notNull: false }
    }),

    db.createTable.bind(db, "permission", {
      id:            {type: "int",     primaryKey: true, autoIncrement: true},
      name:          {type: "string",  unique: true},
      is_global:     {type: "boolean", defaultValue: false}

    }),

    db.createTable.bind(db, "user_permission", {
      user_id:       {type: "int",     primaryKey: true},
      permission_id: {type: "int",     primaryKey: true}
    }),

    db.insert.bind(db, "permission", ["name"], ["login"]),
    db.insert.bind(db, "permission", ["name"], ["add-event"])

  ], callback);
};

exports.down = function (db, callback) {
  async.series([
    db.dropTable.bind(db, "user_permission", callback),
    db.dropTable.bind(db, "permission", callback),
    db.dropTable.bind(db, "registered_user", callback)
  ], callback);
};
