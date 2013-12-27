var passport = require("passport");

var config = require("../../config");

var GoogleStrategy = require("passport-google").Strategy;

var openidStrategy = require("./openidStrategy");

passport.use(new GoogleStrategy(
  {
    realm: config.server.host,
    returnURL: config.server.host + "/auth/google/callback"
  },
  openidStrategy(
    "google", 
    function (args) {
      return args[0];
    },
    function (args) {
      return args[1];
    }
  )
));