/*global __dirname, process*/

require("newrelic");

var express = require("express");
var http = require("http");
var lessMiddleware = require("less-middleware");
var flash = require("connect-flash");
var passport = require("passport");

var nconf = require("./lib/config");
var winston = require("winston");

var OpenIdProvider = require("./lib/rest/login-openid");

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  "level": process.argv[2] === "debug" ? "verbose" : "warn",
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
app.use(express.json());
app.use(express.urlencoded());
app.use(express.cookieSession({
  secret: nconf.auth.sessionSecret,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

require("./lib/rest/auth/localStrategy");
require("./lib/rest/auth/facebookStrategy");
require("./lib/rest/auth/googleStrategy");
require("./lib/rest/auth/twitterStrategy");
require("./lib/rest/auth/githubStrategy");

require("./lib/rest/auth/serializeUser");
require("./lib/rest/auth/deserializeUser");

require("./lib/rest/getCurrentUser").init(app);
require("./lib/rest/logout").init(app);
require("./lib/rest/login").init(app);
require("./lib/rest/register").init(app);

var Provider = new OpenIdProvider(app, server);
new Provider.provider("facebook");
new Provider.provider("google");
new Provider.provider("twitter");
new Provider.provider("github");

require("./lib/rest/editEvent").init(app);
require("./lib/rest/getEvent").init(app);
require("./lib/rest/getEventChanges").init(app);
require("./lib/rest/getEvents").init(app);
require("./lib/rest/getEventTypes").init(app);
require("./lib/rest/getParticipant").init(app);
require("./lib/rest/getPlaces").init(app);
require("./lib/rest/getRecentChanges").init(app);
require("./lib/rest/getRoles").init(app);
require("./lib/rest/getThingSubtypes").init(app);
require("./lib/rest/getThingTypes").init(app);
require("./lib/rest/saveEvent").init(app);

new (require("./lib/rest/search"))(app);

server.listen(nconf.server.port);

winston.info("Listening on port ", nconf.server.port);
