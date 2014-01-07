var when = require("when");
var pipeline = require("when/pipeline");
var bcrypt = require("bcrypt");
var db = require("../db");

module.exports = {
  init: function (app) {
    app.post("/register", this.handleRegister);
  },
  handleRegister: function (req, res, next) {
    var tx;
    var id;

    var params = req.body;

    if (params.username.length === 0) {
      res.statusCode = 400;
      next("a username must be given");
    }

    else if (params.password.length === 0) {
      res.statusCode = 400;
      next("a password must be given");
    }

    else {
      pipeline(
        [
          function () {
            return db.startTransaction();
          },
          function (_tx) {
            tx = _tx;
          },
          function () {
            return db.runQueryInTransaction(
              tx, "get_registered_user_by_username", [params.username]
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
            return db.runQueryInTransaction(tx, "add_local_user", [params.username, hash]);
          },
          function (result) {
            if (result.rows) {
              id = result.rows[0].id;
              db.endTransaction(tx);
            }
          },
          function () {
            req.logIn({id: id}, function (err) {
              if (err) {
                return next(err);
              }
              return res.send({id: id});
            });
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
    }
  }
};
