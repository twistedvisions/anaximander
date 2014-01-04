var passport = require("passport");

var db = require("../../db");

var LocalStrategy = require("passport-local").Strategy;
var bcrypt = require("bcrypt");

var localStrategyImpl = function (username, password, done) {
  db.runQuery("get_registered_user_by_username", [username]).then(

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
};

passport.use(new LocalStrategy(localStrategyImpl));

module.exports = {
  localStrategyImpl: localStrategyImpl
};
