var _ = require("underscore");
var when = require("when");
var passport = require("passport");
var uuid = require("node-uuid");
var socketIo = require("socket.io");
var winston = require("winston");

var loginIdCookieKey = "login-id";
/*

The expected way to use this:

  1. Browser requests facebook authorisation by requesting /auth/facebook
      * this returns:
        1. URL to signup to facebook with, in a new window
        2. ID to identify this authorisation attempt.

  2. Browser stores ID in "login-id" cookie.

  3. Browser opens up websocket connection and registers login by creating a 
     "register-login" message with the ID being sent, and waits for a "complete"
     message

  4. Browser opens up facebook in a new window

  5. When facebook authentication is complete, it calls /auth/facebook/callback

  6. Server looks up cookie in /auth/facebook/callback handler and notifies the 
     corresponding websocket (in the original window) that the authorisation is 
     complete, and redirects to a html page that closes itself.

  7. Browser is notified and can now deal with updated logged-in state.

*/

var LoginFacebook = function (app, server) {


  var io = socketIo.listen(server, {
    logger: {
      debug: winston.debug, 
      info: winston.info, 
      error: winston.error, 
      warn: winston.warn
    }
  });

  var self = this;
  self.logins = {};

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
      var data = {
        location: location, 
        loginId: loginId
      };
      return res.send(data);
    });
  });

  app.get("/auth/facebook/callback", function (req /*, res*/) {
    var loginId = req.cookies[loginIdCookieKey];
    winston.verbose("in /auth/facebook/callback with loginId:", loginId);
    if (self.logins[loginId]) {
      self.logins[loginId].socket.emit("complete");
      self.logins[loginId].socket.disconnect();
      delete self.logins[loginId];
    } else {
      winston.warn("socket not found for loginId:", loginId);
    }
    winston.info("facebook login complete", loginId);
    passport.authenticate("facebook", { 
      successRedirect: "/fb_return.html",
      failureRedirect: "/fb_return.html" 
    }).apply(this, arguments);
  });
};

LoginFacebook.prototype.shutdown = function () {
  clearInterval(this.timeout);
};

module.exports = LoginFacebook;