var _ = require("underscore");

var passport = require("passport");

var config = require("../../config");

var GithubStrategy = require("passport-github").Strategy;

var openidStrategy = require("./openidStrategy");

var makeUsername = require("./makeUsername");

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
      var obj = _.extend(args[2]._json || {}, args[2]);
      makeUsername("github", obj);
      return obj;
    }
  )
));