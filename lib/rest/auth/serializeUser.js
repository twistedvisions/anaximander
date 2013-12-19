var passport = require("passport");

var serializeImpl = function (user, done) {
  done(null, user.id);
};

passport.serializeUser(serializeImpl);

module.exports = {
  serializeImpl: serializeImpl
};
