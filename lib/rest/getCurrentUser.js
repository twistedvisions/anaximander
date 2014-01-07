var _ = require("underscore");
var winston = require("winston");

var userPermissions = require("./util/userPermissions");

module.exports = {
  init: function (app) {
    app.get("/current-user", function (req, res) {
      if (req.isAuthenticated()) {
        userPermissions.get(req.user.id).then(
          function (permissions) {
            res.send(_.extend({
              "logged-in": true,
              permissions: permissions
            }, req.user));
          },
          function () {
            winston.error("failed to process /current-user request", arguments);
          }
        );
      } else {
        res.send({
          "logged-in": false,
          permissions: []
        });
      }
    });
  }
};