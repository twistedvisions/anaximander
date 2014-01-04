var _ = require("underscore");
var db = require("../db");
var winston = require("winston");

module.exports = {
  init: function (app) {
    app.get("/place", function (req, res) {
      var params = req.query;

      db.runQuery("get_nearest_places", [parseFloat(params.lon), parseFloat(params.lat)]).then(
        function (result) {
          var rows = result.rows;
          _.map(rows, function (row) {
            var data;
            var location = row.location;
            //TODO: refactor out of this and getEvents
            if (/MULTILINESTRING/.test(location)) {
              data = /MULTILINESTRING\(\((.*)\)\)/.exec(location)[1];
              var latlons = data.split(",");
              var result = _.map(latlons, function (latlon) {
                var array = latlon.split(" ");
                return [parseFloat(array[1]), parseFloat(array[0])];
              });
              row.location = result;
            } else if (/POINT/.test(location)) {
              data = /POINT\((.*)\)/.exec(location)[1];
              var array = data.split(" ");
              row.location = [[parseFloat(array[1]), parseFloat(array[0])]];
            }
          });
          res.send(result.rows);
        },
        function (err) {
          res.send(500, "Bad query");
          winston.error("failed to process /place query", {
            params: params,
            error: err
          });
        }
      );
    });
  }
};
