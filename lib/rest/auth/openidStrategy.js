var _ = require("underscore");
var winston = require("winston");

var db = require("../../db");

var PostRegistration = require("../util/PostRegistration");

var login = function (provider, data, done) {
  winston.verbose(provider + " user known");
  done(null, _.extend({registered: false}, data));
};

var register = function (provider, identifier, profile, done) {
  var addUser = "add_" + provider + "_user";
  winston.verbose(provider + " user unknown");
  var queryParameters = [
    identifier,
    profile.emails ? profile.emails[0].value : "",
    JSON.stringify(profile.name)
  ];
  db.startTransaction().then(function (tx) {
    db.runQueryInTransaction(tx, addUser, queryParameters).then(
      function (result) {
        if (result.rows.length === 1) {
          var user = result.rows[0];
          winston.verbose(provider + " user created", user);
          PostRegistration(tx, user.id).then(function () {
            db.endTransaction(tx);
            done(null, _.extend({registered: true}, user));
          });
        } else {
          db.rollbackTransaction(tx);
          done({message: "could not add user"});
        }
      },
      function (e) {
        db.rollbackTransaction(tx);
        done(e);
      }
    );
  });
};

var openidStrategy = function (provider, getId, getProfile) {

  var getUser = "get_" + provider + "_user";

  var openidStrategyImpl = function () {
    var identifier = getId(arguments);
    var profile = getProfile(arguments);
    var done = arguments[arguments.length - 1];

    try {
      winston.verbose("login " + provider + " user", profile);
      db.runQuery(getUser, [identifier]).then(
        function (result) {
          if (result.rows.length === 1) {
            login(provider, result.rows[0], done);
          } else {
            register(provider, identifier, profile, done);
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
