var passport = require("passport");

module.exports = {
  init: function (app) {
    app.post("/login", function (req, res, next) {
      passport.authenticate("local", function (err, user/*, info*/) {
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
          return res.send("ok");
        });
      })(req, res, next);
    });
  }
};