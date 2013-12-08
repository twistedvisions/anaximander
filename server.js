/*global __dirname*/

require("newrelic");
var express = require("express");
var lessMiddleware = require("less-middleware");

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
app.use(express.bodyParser());

require("./lib/rest/getEvents").init(app);
require("./lib/rest/getPlaces").init(app);
require("./lib/rest/getAttendee").init(app);
require("./lib/rest/getTypes").init(app);
require("./lib/rest/getSubtypes").init(app);

app.listen(nconf.server.port);

winston.info("Listening on port ", nconf.server.port);
