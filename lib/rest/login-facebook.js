var _ = require("underscore");
var when = require("when");
var passport = require("passport");
var uuid = require("node-uuid");
var socketIo = require("socket.io");
var winston = require("winston");
var loginIdCookieKey = "login-id";

module.exports = {
  init: function (app, server) {

    var io = socketIo.listen(server, {
      logger: {
        debug: winston.debug, 
        info: winston.info, 
        error: winston.error, 
        warn: winston.warn
      }
    });

    var logins = {};

    io.sockets.on("connection", function (socket) {
      socket.on("register-login", function (data) {
        winston.info("registered login", data);
        logins[data.key] = {
          socket: socket, 
          time: new Date().getTime()
        };
      });
    });

    setInterval(function () {
      var toRemove = _.pluck(_.filter(_.pairs(logins), function (pair) {
        return pair[1].time > new Date().getTime() - 10 * 60 * 1000;
      }), 0);
      if (toRemove.length > 0) {
        winston.info("removing dead connections", toRemove);
        logins = _.omit(logins, toRemove);
      }
    }, 60 * 1000);

    app.get("/auth/facebook", function (req, res) {
      var d = when.defer();
      var location;
      passport.authenticate("facebook")({}, {
        setHeader: function (key, value) {
          if (key === "Location") {
            location = value;
          }
        },
        end: function () {
          d.resolve(location);
        }
      });
      d.promise.then(function () {
        var loginId = uuid.v1();
        return res.send({location: location, loginId: loginId});
      });
    });

    app.get("/auth/facebook/callback", function (req, res) {
      var loginId = req.cookies[loginIdCookieKey];
      logins[loginId].socket.emit("complete");
      delete logins[loginId];
      winston.info("facebook login complete", loginId);
      // res.redirect("/fb_return.html");
      passport.authenticate("facebook", { 
        successRedirect: "/fb_return.html",
        failureRedirect: "/fb_return.html" 
      }).apply(this, arguments);
    });
  }
};