var _ = require("underscore");
var db = require("../../db");
var winston = require("winston");

var openidStrategy = function (provider, getId, getProfile) {

  var getUser = "get_" + provider + "_user";
  var addUser = "add_" + provider + "_user";

  var openidStrategyImpl = function () {
    var identifier = getId(arguments);
    var profile = getProfile(arguments);
    var done = arguments[arguments.length - 1];

    try {
      winston.verbose("login " + provider + " user", profile);
      db.runQuery(getUser, [identifier]).then(
        function (result) {
          if (result.rows.length === 1) {
            winston.verbose(provider + " user known");
            done(
              null, 
              _.extend({registered: false}, result.rows[0])
            );
          } else {
            winston.verbose(provider + " user unknown");
            var queryParameters = [
              identifier, 
              profile.emails ? profile.emails[0].value : "",
              JSON.stringify(profile.name)
            ];
            db.runQuery(addUser, queryParameters).then(
              function (result) {

                if (result.rows.length === 1) {
                  winston.verbose(provider + " user created", result.rows[0]);
                  done(
                    null, 
                    _.extend({registered: true}, result.rows[0])
                  );
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
      winston.error("exception while logging in " + provider + " user");
      winston.error(e);
      done(e);
    }
  };

  return openidStrategyImpl;
};

module.exports = openidStrategy;
