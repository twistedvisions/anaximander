/*global console, __dirname*/

require("newrelic");
var _ = require("underscore");

var fs = require("fs");
var express = require("express");
var lessMiddleware = require("less-middleware");

var db = require("./lib/db");

var nconf = require("./lib/config");


var winston = require("winston");
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  "level": "warn", 
  "timestamp": true, 
  "colorize": true
});

var getEventTypes = _.template(fs.readFileSync("db_templates/get_event_types.sql").toString());
var getEventSubtypes = _.template(fs.readFileSync("db_templates/get_event_subtypes.sql").toString());
var app = express();

app.configure(function () {    
  app.use(lessMiddleware({
    src: __dirname + "/public",
    compress: true
  }));
});

app.use(express["static"](__dirname + "/public"));

require("./lib/rest/getEvents").init(app);

app.get("/type", function (req, res) {
  db.runQuery(
    getEventTypes({})
  ).then(
    function (result) {
      res.send(result.rows);
    }, 
    function () {
      winston.error("failed to process /type request", arguments);
      console.log("err", arguments);
    }
  );
});

app.get("/type/:id/type", function (req, res) {
  db.runQuery(
    getEventSubtypes({
      parent_type: req.param("id")
    })
  ).then(
    function (result) {
      result.rows = _.map(result.rows, function (row) {
        row.parent_type = parseInt(row.parent_type, 10);
        return row;
      });
      res.send(result.rows);
    }, 
    function () {
      winston.error("failed to process /type/:id/type request", arguments);
      console.log("err", arguments);
    }
  );
});

app.listen(nconf.server.port);

winston.info("Listening on port ", nconf.server.port);
