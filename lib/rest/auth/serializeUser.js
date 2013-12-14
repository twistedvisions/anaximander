var passport = require("passport");
passport.serializeUser(function (user, done) {
  done(null, user.id);
});