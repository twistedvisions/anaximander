var _ = require("underscore");
var fs = require("fs");
var passport = require("passport");

var db = require("../../db");

var getUserById = _.template(fs.readFileSync("db_templates/get_user_by_id.sql").toString());

passport.deserializeUser(function (id, done) {
  db.runQuery(getUserById({
    id: id
  })).then(
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
});