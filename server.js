/*global __dirname, process*/
/*jshint unused:false */

require("newrelic");

var express = require("express");
var https = require("https");
var http = require("http");
var flash = require("connect-flash");
var passport = require("passport");
var fs = require("fs");

var nconf = require("./lib/config");
var winston = require("winston");

var OpenIdProvider = require("./lib/rest/login-openid");

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  "level": process.argv[2] === "debug" ? "verbose" : "warn",
  "timestamp": true,
  "colorize": true
});

var options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
  ca: [
    fs.readFileSync("AddTrustExternalCARoot.crt"),
    fs.readFileSync("PositiveSSLCA2.crt"),
    fs.readFileSync("retred_org.crt")
  ]
};

var secureApp = express();
var unsecureApp = express();

var secureServer = https.createServer(options, secureApp);
var unsecureServer = http.createServer(unsecureApp);

unsecureApp.get("*", function (req, res) {
  res.redirect(nconf.server.host + req.url);
});

secureApp.use(express.compress());
secureApp.use(express["static"](__dirname + "/public"));
secureApp.use(express.cookieParser());
secureApp.use(express.json());
secureApp.use(express.urlencoded());
secureApp.use(express.cookieSession({
  secret: nconf.auth.sessionSecret,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}));
secureApp.use(flash());

secureApp.use(passport.initialize());
secureApp.use(passport.session());


require("./lib/rest/auth/localStrategy");
require("./lib/rest/auth/facebookStrategy");
require("./lib/rest/auth/googleStrategy");
require("./lib/rest/auth/twitterStrategy");
require("./lib/rest/auth/githubStrategy");

require("./lib/rest/auth/serializeUser");
require("./lib/rest/auth/deserializeUser");

require("./lib/rest/getCurrentUser").init(secureApp);
require("./lib/rest/logout").init(secureApp);
require("./lib/rest/login").init(secureApp);
require("./lib/rest/register").init(secureApp);

var Provider = new OpenIdProvider(secureApp, secureServer);
new Provider.provider("facebook");
new Provider.provider("google");
new Provider.provider("twitter");
new Provider.provider("github");

require("./lib/rest/editEvent").init(secureApp);
require("./lib/rest/editImportance").init(secureApp);
require("./lib/rest/editThing").init(secureApp);
require("./lib/rest/editType").init(secureApp);
require("./lib/rest/getEvent").init(secureApp);
require("./lib/rest/getEventChanges").init(secureApp);
require("./lib/rest/getEventTypeImportanceUsage").init(secureApp);
require("./lib/rest/getEvents").init(secureApp);
require("./lib/rest/getEventTypeUsage").init(secureApp);
require("./lib/rest/getEventTypes").init(secureApp);
require("./lib/rest/getParticipant").init(secureApp);
require("./lib/rest/getPlaces").init(secureApp);
require("./lib/rest/getRecentChanges").init(secureApp);
require("./lib/rest/getRoleImportanceUsage").init(secureApp);
require("./lib/rest/getRoleUsage").init(secureApp);
require("./lib/rest/getRoles").init(secureApp);
require("./lib/rest/getThing").init(secureApp);
require("./lib/rest/getThingChanges").init(secureApp);
require("./lib/rest/getThingSubtypeImportanceUsage").init(secureApp);
require("./lib/rest/getThingSubtypeUsage").init(secureApp);
require("./lib/rest/getThingSubtypes").init(secureApp);
require("./lib/rest/getThingTypes").init(secureApp);
require("./lib/rest/saveEvent").init(secureApp);

new (require("./lib/rest/search"))(secureApp);

secureApp.use(function (err, req, res, next) {
  if (err.message.match(/please login/)) {
    res.send(401, err.message);
  } else if (err.message.match(/User lacks '.*' permission/)) {
    res.send(403, err.message);
  } else if (err.message.match(/.*last_edited times do not match.*/)) {
    res.send(409, err.message);
  } else {
    winston.error("Error occurred: " + err.message);
    winston.error(err.stack);
    res.send(500, "An internal error occurred");
  }
});

secureServer.listen(nconf.server.securePort);
unsecureServer.listen(nconf.server.unsecurePort);

winston.info("Listening on port ", nconf.server.securePort);
