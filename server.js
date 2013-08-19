var _ = require('underscore');

var fs = require('fs');
var express = require('express');

var db = require("./lib/db")

var getEventAttendeesAtPoint = _.template(fs.readFileSync("db_templates/get_event_attendees_at_point.sql").toString());

var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/location', function(req, res) {
  var params = req.query;
  db.runQuery(
    getEventAttendeesAtPoint({
      lat: parseFloat(params.lat), 
      lon: parseFloat(params.lon)
    })
  ).then(
    function (result) {
      var rows = result.rows;
      _.map(rows, function (row) {
        var location = row.location;
        if (/MULTILINESTRING/.test(location)) {
          var data = /MULTILINESTRING\(\((.*)\)\)/.exec(location)[1];
          var latlons = data.split(",");
          var result = _.map(latlons, function (latlon) {
            var array = latlon.split(" ");
            return [parseFloat(array[1]), parseFloat(array[0])];
          });
          row.location = result;
        } else if (/POINT/.test(location)) {
          var data = /POINT\((.*)\)/.exec(location)[1];
          var array = data.split(" ");
          row.location = [[parseFloat(array[1]), parseFloat(array[0])]];
        }
      });
      res.send(result.rows);
    }, 
    function () {
      console.log("err", arguments)
    }
  );
});

app.listen(8000);

console.log('Listening on port 8000');