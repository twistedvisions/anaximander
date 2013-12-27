var _ = require("underscore");
var when = require("when");
var passport = require("passport");
var uuid = require("node-uuid");
var socketIo = require("socket.io");
var winston = require("winston");

var loginIdCookieKey = "login-id";
/*

The expected way to use this:

  1. Browser requests authorisation by requesting /auth/<provider>
      * this returns:
        1. URL to signup to <provider> with, in a new window
        2. ID to identify this authorisation attempt.

  2. Browser stores ID in "login-id" cookie.

  3. Browser opens up websocket connection and registers login by creating a 
     "register-login" message with the ID being sent, and waits for a "complete"
     message

  4. Browser opens up <provider> in a new window

  5. When <provider> authentication is complete, it calls /auth/<provider>/callback

  6. Server looks up cookie in /auth/<provider>/callback handler and notifies the 
     corresponding websocket (in the original window) that the authorisation is 
     complete, and redirects to a html page that closes itself.

  7. Browser is notified and can now deal with updated logged-in state.

*/


var LoginOpenId = function (app, server) {
  
  var io = socketIo.listen(server, {
    logger: {
      debug: winston.debug, 
      info: winston.info, 
      error: winston.error, 
      warn: winston.warn
    }
  });

  var self = this;
  this.logins = {};

  io.sockets.on("connection", function (socket) {
    socket.on("register-login", function (data) {
      winston.info("registered login", data);
      self.logins[data.key] = {
        socket: socket, 
        time: new Date().getTime()
      };
    });
    socket.on("update-login", function (data) {
      winston.info("update login with id:", data.old, "to", data["new"]);
      delete self.logins[data.old];
      self.logins[data["new"]] = {
        socket: socket, 
        time: new Date().getTime()
      };
    });
  });

  this.timeout = setInterval(_.bind(function () {
    var thresholdTime = new Date().getTime() - 10 * 60 * 1000;
    var toRemove = _.pluck(_.filter(_.pairs(self.logins), function (pair) {
      return pair[1].time < thresholdTime;
    }), 0);
    if (toRemove.length > 0) {
      winston.info("removing dead connections", toRemove);
      _.each(toRemove, function (loginId) {
        try {
          self.logins[loginId].socket.disconnect();
        } catch (e) {
          winston.warn("could not close connection - " + loginId);
        }
      });
      self.logins = _.omit(self.logins, toRemove);
    }
  }, this), 60 * 1000);

  this.provider = function (provider) { 
    app.get("/auth/" + provider, function (req, res) {
      var d = when.defer();
      var location;
      passport.authenticate(provider)({}, {
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
        var data = {
          location: location, 
          loginId: loginId
        };
        return res.send(data);
      });
    });

    app.get("/auth/" + provider + "/callback", function (req, res, next) {
      var loginId = req.cookies[loginIdCookieKey];
      winston.verbose("in /auth/" + provider + "/callback with loginId:", loginId);
      var completeLoginHandshake = function (user) {
        if (self.logins[loginId]) {
          self.logins[loginId].socket.emit("complete", user || {});
          self.logins[loginId].socket.disconnect();
          delete self.logins[loginId];
        } else {
          winston.warn("socket not found for loginId:", loginId);
        }
      };
      
      passport.authenticate(provider, function (err, user/*, info*/) {
        if (err) { 
          completeLoginHandshake({
            message: "error while authenticating",
            errMessage: err.message
          });
          winston.warn(provider + " login not complete - error while authenticating", loginId);
          
          return next(err); 
        }
        if (!user) { 
          completeLoginHandshake({
            message: "user not authenticated"
          });
          winston.info(provider + " login not complete - user not authenticated", loginId);
          return res.redirect("/fb_return.html"); 
        }
        req.logIn(user, function (err) {
          if (err) { 
            completeLoginHandshake({
              message: "error while logging in",
              errMessage: err.message
            });
            return next(err); 
          }
          completeLoginHandshake(user);
          winston.info(provider + " login complete", loginId);
          return res.redirect("/fb_return.html");
        });
      }).apply(this, arguments);
    });
  };
};


LoginOpenId.prototype.shutdown = function () {
  clearInterval(this.timeout);
};


module.exports = LoginOpenId;