var _ = require("underscore");
var fs = require("fs");
var passport = require("passport");
var winston = require("winston");

var db = require("../../db");

var config = require("../../config");

var FacebookStrategy = require("passport-facebook").Strategy;
var getFacebookUser = _.template(fs.readFileSync("db_templates/get_facebook_user.sql").toString());
var addFacebookUser = _.template(fs.readFileSync("db_templates/add_facebook_user.sql").toString());

var facebookStrategyImpl = function (accessToken, refreshToken, profile, done) {
  try {
    winston.verbose("login facebook user", profile);
    db.runQuery(getFacebookUser({
      facebook_id: profile.id
    })).then(
      function (result) {
        if (result.rows.length === 1) {
          winston.verbose("facebook user known");
          done(null, result.rows[0]);
        } else {
          winston.verbose("facebook user unknown");
          db.runQuery(addFacebookUser({
            facebook_id: profile.id,
            email: profile.emails ? profile.emails[0].value : "",
            name: profile.name
          })).then(
            function (result) {
              if (result.rows.length === 1) {
                winston.verbose("facebook user created", result.rows[0]);
                done(null, result.rows[0]);
              } else {
                done({message: "could not add user"});
              }
            },
            function (e) {
              done(e);
            }
          );
        }
      }, 
      function (err) {
        done(err);
      }
    );
  } catch (e) {
    winston.error("exception while logging in facebook user");
    winston.error(e);
    done(e);
  }
};

passport.use(new FacebookStrategy(
  {
    clientID: config.auth.facebook.clientId,
    clientSecret: config.auth.facebook.clientSecret,
    callbackURL: config.auth.host + "/auth/facebook/callback"
  },
  facebookStrategyImpl
));

module.exports = {
  facebookStrategyImpl: facebookStrategyImpl
};