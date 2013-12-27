var _ = require("underscore");
var fs = require("fs");
var winston = require("winston");

var db = require("../../db");

var openidStrategy = function (provider, getId, getProfile) {

  var getUser = _.template(fs.readFileSync("db_templates/get_" + provider + "_user.sql").toString());
  var addUser = _.template(fs.readFileSync("db_templates/add_" + provider + "_user.sql").toString());

  var openidStrategyImpl = function () {
    var identifier = getId(arguments);
    var profile = getProfile(arguments);
    var done = arguments[arguments.length - 1];

    try {
      winston.verbose("login " + provider + " user", profile);
      var queryArgs = {};
      queryArgs[provider + "_id"] = identifier;
      db.runQuery(getUser(queryArgs)).then(
        function (result) {
          if (result.rows.length === 1) {
            winston.verbose(provider + " user known");
            done(
              null, 
              _.extend({registered: false}, result.rows[0])
            );
          } else {
            winston.verbose(provider + " user unknown");
            var queryArgs = {
              email: profile.emails ? profile.emails[0].value : "",
              name: JSON.stringify(profile.name)
            };
            queryArgs[provider + "_id"] = identifier;
            db.runQuery(addUser(queryArgs)).then(
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
