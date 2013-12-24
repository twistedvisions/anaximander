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
var unsecureServer = http.createServer(secureApp);

unsecureApp.get("*", function (req, res) {  
  res.redirect(nconf.server.host + nconf.server.port + req.url);
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
require("./lib/rest/auth/serializeUser");
require("./lib/rest/auth/deserializeUser");

require("./lib/rest/getCurrentUser").init(secureApp);
require("./lib/rest/logout").init(secureApp);
require("./lib/rest/login").init(secureApp);
require("./lib/rest/register").init(secureApp);
new require("./lib/rest/login-facebook")(secureApp, secureServer);

require("./lib/rest/getEvents").init(secureApp);
require("./lib/rest/saveEvent").init(secureApp);
require("./lib/rest/getPlaces").init(secureApp);
require("./lib/rest/getAttendee").init(secureApp);
require("./lib/rest/getTypes").init(secureApp);
require("./lib/rest/getSubtypes").init(secureApp);

unsecureServer.listen(nconf.server.unsecurePort);
secureServer.listen(nconf.server.securePort);

winston.info("Listening on port ", nconf.server.securePort);
