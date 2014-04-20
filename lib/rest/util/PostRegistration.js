var when = require("when");
var db = require("../../db");

module.exports = function (tx, userId) {
  var d = when.defer();
  db.runQueryInTransaction(tx, "add_initial_user_permissions", [userId]).then(function (result) {
    if (result.rows.length >= 1) {
      d.resolve();
    } else {
      d.reject();
    }
  }, d.reject);

  return d.promise;
};