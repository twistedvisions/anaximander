var _ = require("underscore");
var fs = require("fs");
var when = require("when");
var pipeline = require("when/pipeline");
var bcrypt = require("bcrypt");
var db = require("../db");

var getRegisteredUserByUsername = _.template(fs.readFileSync("db_templates/get_registered_user_by_username.sql").toString());
var addLocalUser = _.template(fs.readFileSync("db_templates/add_local_user.sql").toString());

module.exports = {
  init: function (app) {
    app.post("/register", function (req, res, next) {
      var tx;
      var params = req.body;

      pipeline(
        [
          db.startTransaction,
          function (_tx) {
            tx = _tx;
          },
          function () {
            return db.runQueryInTransaction(
              getRegisteredUserByUsername({username: params.username}),
              tx
            );
          },
          function (result) {
            var d = when.defer();
            if (result.rows.length > 0) {
              db.rollbackTransaction(tx);
              d.reject("user already exists");
            } else {
              bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(params.password, salt, function (err, hash) {
                  if (err) {
                    d.reject(err);
                  } else {
                    d.resolve(hash);
                  }
                });
              });
            }

            return d.promise;
          },
          function (hash) {
            return db.runQueryInTransaction(
              addLocalUser({
                username: params.username, 
                password: hash
              }),
              tx
            );
          },
          function () {
            db.endTransaction(tx);
          }
        ]
      ).then(
        function () {
          res.send({status: "success"});
        },
        function (err) {
          if (err === "user already exists") {
            res.statusCode = 422;
          }
          db.rollbackTransaction(tx);
          return next(err);
        });
    });
  }
};