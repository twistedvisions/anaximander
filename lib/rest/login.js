var _ = require("underscore");
var passport = require("passport");

var userPermissions = require("./util/userPermissions");

module.exports = {
  init: function (app) {
    app.post("/login", _.bind(function (req, res, next) {
      var auth = passport.authenticate("local",
        _.bind(this.authenticate, this, req, res, next));
      auth(req, res, next);
    }, this));
  },
  authenticate: function (req, res, next, err, user/*, info*/) {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.statusCode = 400;
      return res.send("no user matches");
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }

      return userPermissions.get(user.id).then(
        function (permissions) {
          res.send({
            id: user.id,
            permissions: permissions
          });
        }
      );
    });
  }
};