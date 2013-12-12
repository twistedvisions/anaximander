var _ = require("underscore");
var fs = require("fs");
var passport = require("passport");

var db = require("../../db");

var LocalStrategy = require("passport-local").Strategy;
var getRegisteredUserByUsername = _.template(fs.readFileSync("db_templates/get_registered_user_by_username.sql").toString());
var bcrypt = require("bcrypt");

passport.use(new LocalStrategy(function (username, password, done) {
  db.runQuery(getRegisteredUserByUsername({
    username: username
  })).then(
    function (result) {
      
      if (result.rows.length === 0) {
        return done(null, false, { 
          message: "Incorrect username." 
        });
      }

      var user = result.rows[0];

      bcrypt.compare(password, user.password, function (err, res) {
        if (err) { 
          done(err); 
        } else if (res) {
          done(null, user);
        } else {
          done(null, false, { 
            message: "Incorrect password." 
          });
        }
      });
    },
    function (err) {
      return done(err);
    }
  );
}));