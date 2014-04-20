var passport = require("passport");

var config = require("../../config");

var FacebookStrategy = require("passport-facebook").Strategy;

var openidStrategy = require("./openidStrategy");
var makeUsername = require("./makeUsername");

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
      var obj = args[2];
      makeUsername("facebook", obj);
      return obj;
    }
  )
));