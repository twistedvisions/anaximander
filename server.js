/*global __dirname*/

require("newrelic");

var express = require("express");
var http = require("http");
var lessMiddleware = require("less-middleware");
var flash = require("connect-flash");
var passport = require("passport");

var nconf = require("./lib/config");

var winston = require("winston");

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  "level": "warn", 
  "timestamp": true, 
  "colorize": true
});

var app = express();

var server = http.createServer(app);

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


app.use(passport.initialize());
app.use(passport.session());

require("./lib/rest/auth/localStrategy");
require("./lib/rest/auth/facebookStrategy");
require("./lib/rest/auth/serializeUser");
require("./lib/rest/auth/deserializeUser");

require("./lib/rest/getCurrentUser").init(app);
require("./lib/rest/logout").init(app);
require("./lib/rest/login").init(app);
require("./lib/rest/register").init(app);
require("./lib/rest/login-facebook").init(app, server);

require("./lib/rest/getEvents").init(app);
require("./lib/rest/saveEvent").init(app);
require("./lib/rest/getPlaces").init(app);
require("./lib/rest/getAttendee").init(app);
require("./lib/rest/getTypes").init(app);
require("./lib/rest/getSubtypes").init(app);

server.listen(nconf.server.port);

winston.info("Listening on port ", nconf.server.port);
