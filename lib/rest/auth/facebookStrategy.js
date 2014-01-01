var passport = require("passport");

var config = require("../../config");

var FacebookStrategy = require("passport-facebook").Strategy;

var openidStrategy = require("./openidStrategy");

passport.use(new FacebookStrategy(
  {
    clientID: config.auth.facebook.clientId,
    clientSecret: config.auth.facebook.clientSecret,
    callbackURL: config.server.host + "/auth/facebook/callback"
  },
  openidStrategy(
    "facebook", 
    function (args) {
      return args[2].id;
    },
    function (args) {
      return args[2];
    }
  )
));