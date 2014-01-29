var _ = require("underscore");
var winston = require("winston");
var when = require("when");
var db = require("../db");

var userPermissions = require("./util/userPermissions");

module.exports = {
  init: function (app) {
    app.get("/current-user", this.handler);
  },
  handler: function (req, res) {
    var d = when.defer();
    if (req.isAuthenticated()) {
      userPermissions.get(req.user.id).then(
        function (permissions) {
          res.send(_.extend({
            "logged-in": true,
            permissions: permissions
          }, req.user));
          db.runQuery("update_user_last_ip", [req.user.id, req.ip]).then(
            d.resolve, d.reject
          );
        },
        function (e) {
          winston.error("failed to process /current-user request", arguments);
          d.reject(e);
        }
      );
    } else {
      res.send({
        "logged-in": false,
        permissions: []
      });
      d.resolve();
    }
    return d.promise;
  }
};