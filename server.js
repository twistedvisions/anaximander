/*global __dirname*/

require("newrelic");

var express = require("express");
var https = require("https");
var http = require("http");
var lessMiddleware = require("less-middleware");
var flash = require("connect-flash");
var passport = require("passport");
var fs = require("fs");

var nconf = require("./lib/config");
var winston = require("winston");

var OpenIdProvider = require("./lib/rest/login-openid");

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  "level": "warn", 
  "timestamp": true, 
  "colorize": true
});

var options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
};

var secureApp = express();
var unsecureApp = express();

var secureServer = https.createServer(options, secureApp);
var unsecureServer = http.createServer(unsecureApp);

unsecureApp.get("*", function (req, res) {
  res.redirect(nconf.server.host + req.url);
});

secureApp.configure(function () {    
  secureApp.use(lessMiddleware({
    src: __dirname + "/public",
    compress: true
  }));
});

secureApp.use(express["static"](__dirname + "/public"));
secureApp.use(express.cookieParser());
secureApp.use(express.bodyParser());
secureApp.use(express.session({
  secret: nconf.auth.sessionSecret
}));
secureApp.use(flash());

secureApp.use(passport.initialize());
secureApp.use(passport.session());

require("./lib/rest/auth/localStrategy");
require("./lib/rest/auth/facebookStrategy");
require("./lib/rest/auth/googleStrategy");
require("./lib/rest/auth/twitterStrategy");
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

require("./lib/rest/getEvents").init(secureApp);
require("./lib/rest/saveEvent").init(secureApp);
require("./lib/rest/getPlaces").init(secureApp);
require("./lib/rest/getAttendee").init(secureApp);
require("./lib/rest/getTypes").init(secureApp);
require("./lib/rest/getSubtypes").init(secureApp);

secureServer.listen(nconf.server.securePort);
unsecureServer.listen(nconf.server.unsecurePort);

winston.info("Listening on port ", nconf.server.securePort);
