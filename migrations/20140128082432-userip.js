/*global exports */
require("db-migrate");

exports.up = function (db, callback) {
  db.addColumn("registered_user", "last_ip", {
    type: "string",
    notNull: false
  }, callback);
};

exports.down = function (db, callback) {
  db.removeColumn("registered_user", "last_ip", callback);
};
