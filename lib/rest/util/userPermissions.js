var fs = require("fs");
var _ = require("underscore");
var when = require("when");
var db = require("../../db");

var getPermissionsQueries = {
  user: _.template(fs.readFileSync("db_templates/get_user_permissions.sql").toString()),
  global: _.template(fs.readFileSync("db_templates/get_global_permissions.sql").toString())
};

var getPermissions = function (type, queryParams) {
  var d = when.defer();
  db.runQuery(
    getPermissionsQueries[type](queryParams)
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
    var userPermissions = getPermissions("user", {user_id: userId});
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