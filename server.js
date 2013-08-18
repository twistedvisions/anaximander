var _ = require('underscore');

var fs = require('fs');
var express = require('express');

var db = require("./lib/db")

var getEventAttendeesAtPoint = _.template(fs.readFileSync("db_templates/get_event_attendees_at_point.sql").toString());

var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/location', function(req, res) {
  db.runQuery(
    getEventAttendeesAtPoint({
      lat: -42.880556, 
      lon: 147.325
    })
  ).then(function (result) {
    res.send(result.rows);
  }, function () {
    console.log("err", arguments)
  });
});

app.listen(8000);

console.log('Listening on port 8000');