var passport = require("passport");

var db = require("../../db");

var deserializer = function (id, done) {
  db.runQuery("get_user_by_id", [id]).then(
    function (result) {
      if (result.rows.length === 1) {
        done(null, result.rows[0]);
      } else {
        done({message: "user not found"});
      }
    },
    function (e) {
      done(e);
    }
  );
};

passport.deserializeUser(deserializer);

module.exports = {
  deserializer: deserializer
};