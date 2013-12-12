/*global __dirname*/

require("newrelic");
var express = require("express");
var lessMiddleware = require("less-middleware");
var flash = require("connect-flash");

var nconf = require("./lib/config");

var winston = require("winston");
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  "level": "warn", 
  "timestamp": true, 
  "colorize": true
});

var app = express();

app.configure(function () {    
  app.use(lessMiddleware({
    src: __dirname + "/public",
    compress: true
  }));
});

app.use(express["static"](__dirname + "/public"));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({
  secret: nconf.server.sessionSecret
}));
app.use(flash());

var _ = require("underscore");
var fs = require("fs");
var db = require("./lib/db");
var passport = require("passport");

var getUserById = _.template(fs.readFileSync("db_templates/get_user_by_id.sql").toString());

app.use(passport.initialize());
app.use(passport.session());

require("./lib/rest/auth/localStrategy");
require("./lib/rest/auth/facebookStrategy");

passport.serializeUser(function (user, done) {
  console.log("ser", user)
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  console.log("deser")
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

var authenticatedOrNot = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
};

var userExists = function (req, res, next) {
  // Users.count({
  //   username: req.body.username
  // }, function (err, count) {
  //   if (count === 0) {
  //     next();
  //   } else {
  //     // req.session.error = "User Exist"
  //     res.redirect("/singup");
  //   }
  // });
  Users.count({
    username: req.body.username
  }, function (err, count) {
    if (count === 0) {
      next();
    } else {
      // req.session.error = "User Exist"
      res.redirect("/singup");
    }
  });
};

require("./lib/rest/login").init(app);
require("./lib/rest/register").init(app);
require("./lib/rest/getEvents").init(app);
require("./lib/rest/saveEvent").init(app);
require("./lib/rest/getPlaces").init(app);
require("./lib/rest/getAttendee").init(app);
require("./lib/rest/getTypes").init(app);
require("./lib/rest/getSubtypes").init(app);

app.listen(nconf.server.port);

winston.info("Listening on port ", nconf.server.port);
