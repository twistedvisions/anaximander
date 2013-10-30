/*global console, __dirname*/

require("newrelic");
var _ = require("underscore");

var fs = require("fs");
var express = require("express");
var lessMiddleware = require("less-middleware");

var db = require("./lib/db");

var nconf = require("./lib/config");

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
      console.log("err", arguments);
    }
  );
});

app.listen(nconf.server.port);

console.log("Listening on port ", nconf.server.port);
