var passport = require("passport");

var config = require("../../config");

var GithubStrategy = require("passport-github").Strategy;

var openidStrategy = require("./openidStrategy");

passport.use(new GithubStrategy(
  {
    clientID: config.auth.github.clientId,
    clientSecret: config.auth.github.clientSecret,
    callbackURL: config.server.host + "/auth/github/callback"
  },
  openidStrategy(
    "github", 
    function (args) {
      return args[2].id;
    },
    function (args) {
      return args[2];
    }
  )
));