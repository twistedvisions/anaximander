var _ = require("underscore");
var passport = require("passport");

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
      return res.send({id: user.id});
    });
  }
};