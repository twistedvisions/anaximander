/*global exports*/
var dbm = require("db-migrate");
var type = dbm.dataType;

exports.up = function (db, callback) {
  db.createTable("registered_user", {
    id:          {type: "int",    primaryKey: true, autoIncrement: true},
    username:    {type: "string", notNull: false, unique: true },
    password:    {type: "string", notNull: false },
    facebook_id: {type: "string", notNull: false },
    email:       {type: "string", notNull: false, unique: true },
    name:        {type: "string", notNull: false }
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable("registered_user", callback);
};
