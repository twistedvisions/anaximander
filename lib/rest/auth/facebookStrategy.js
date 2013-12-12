var _ = require("underscore");
var fs = require("fs");
var passport = require("passport");

var db = require("../../db");

var FacebookStrategy = require("passport-facebook").Strategy;
var getFacebookUser = _.template(fs.readFileSync("db_templates/get_facebook_user.sql").toString());
var addFacebookUser = _.template(fs.readFileSync("db_templates/add_facebook_user.sql").toString());

passport.use(new FacebookStrategy(
  {
    clientID: "477547232364337",
    clientSecret: "819be2c08897a22428d0b4facbf89146",
    callbackURL: "http://localhost:8000/auth/facebook/callback"
  },
  // {
  //   clientID: "236088309885161",
  //   clientSecret: "2b72bb10fea863c8c09776052231fea5",
  //   callbackURL: "http://retred.org/auth/facebook/callback"
  // },
  function (accessToken, refreshToken, profile, done) {
    db.runQuery(getFacebookUser({
      facebook_id: profile.id
    })).then(
      function (err, result) {
        if (result.rows.length === 1) {
          done(null, result.rows[0]);
        } else {
          db.runQuery(addFacebookUser({
            facebook_id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName
          })).then(
            function (result) {
              if (result.rows.length === 1) {
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
      }
    );
  }
));