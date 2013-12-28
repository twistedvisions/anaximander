var passport = require("passport");

var config = require("../../config");

var TwitterStrategy = require("passport-twitter").Strategy;

var openidStrategy = require("./openidStrategy");

passport.use(new TwitterStrategy(
  {
    consumerKey: config.auth.twitter.consumerKey,
    consumerSecret: config.auth.twitter.consumerSecret,
    callbackURL: config.server.host + "/auth/twitter/callback"
  },
  openidStrategy(
    "twitter", 
    function (args) {
      return args[2].id;
    },
    function (args) {
      return args[2];
    }
  )
));