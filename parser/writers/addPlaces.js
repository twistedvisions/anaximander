var when = require("when"),
    guard = require('when/guard'),
    _ = require("underscore"),
    db = require("../../lib/db"),
    utils = require("../utils");

module.exports = function (data) {
  
  console.log("adding places");
  
  var placeInsert = _.template(
    "INSERT INTO place (name, location, start_date, end_date, link) " +
    "VALUES ('<%= name %>', " +
    "ST_GeomFromText('POINT(' || <%= lon %> || ' ' || <%= lat %> || ')'), " +
    "<%= start_date %>, <%= end_date %>, '<%= link %>')"
  );

  var cleanLatLon = function (str) {
    var commaPos = str.indexOf(",");
    return commaPos > 0 ? str.substring(0, commaPos) : str; 
  }

  return when.map(_.pairs(data), guard(guard.n(1), function (pair) {

    var key = pair[0];
    var value = pair[1];

    if (value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"] &&
        value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"]) {

      var insert = placeInsert({
        name: utils.extractName(key), 
        lat: cleanLatLon(value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"][0].value),
        lon: cleanLatLon(value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"][0].value), 
        start_date: "NULL", 
        end_date: "NULL",
        link: utils.escapeQuote(value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"][0].link)
      });
    
      return db.runQuery(insert).then(
        function () {
         
        }, 
        function (e) {
          console.log("failed writing places", insert, e);
        }
      );

    }

  })).then(
    function () {
      console.log("done writing places")
    }, 
    function (e) {
      console.log("failed writing places", insert, e);
    }
  );
};
