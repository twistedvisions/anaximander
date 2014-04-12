var _ = require("underscore");
var when = require("when");
var db = require("../../db");

var getPermissionsQueries = {
  user: "get_user_permissions",
  global: "get_global_permissions"
};

var getPermissions = function (type, tx, queryParams) {
  var d = when.defer();
  var fn = !!tx ? _.bind(db.runQueryInTransaction, db, tx) : _.bind(db.runQuery, db);
  fn(
    getPermissionsQueries[type], queryParams
  ).then(
    function (result) {
      var permissions = result.rows;
      d.resolve(permissions);
    },
    d.reject
  );
  return d.promise;
};

module.exports = {
  get: function (userId, tx) {
    var d = when.defer();
    var userPermissions = getPermissions("user", tx, [userId]);
    var globalPermissions = getPermissions("global", tx);
    when.all([userPermissions, globalPermissions]).then(
      function (values) {
        d.resolve(_.uniq(
          _.flatten(values, true),
          false,
          function (el) {
            return el.id;
          }
        ));
      },
      d.reject
    );
    return d.promise;
  }
};