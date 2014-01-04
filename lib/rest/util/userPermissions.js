var _ = require("underscore");
var when = require("when");
var db = require("../../db");

var getPermissionsQueries = {
  user: "get_user_permissions",
  global: "get_global_permissions"
};

var getPermissions = function (type, queryParams) {
  var d = when.defer();
  db.runQuery(
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
  get: function (userId) {
    var d = when.defer();
    var userPermissions = getPermissions("user", [userId]);
    var globalPermissions = getPermissions("global");
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