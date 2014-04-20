/*global exports */
require("db-migrate");

exports.up = function (db, callback) {
  db.insert("permission", ["name", "is_global"], [
    "edit-event",
    false
  ], callback);

};

exports.down = function (db, callback) {
  db.runSql("delete from permission where name = 'edit-event';", callback);
};
