var winston = require("winston");
var when = require("when");
var _ = require("underscore");
var db = require("../db");

var Search = function (app) {
  app.get("/search", _.bind(this.handleSearch, this));
};

Search.prototype.handleSearch = function (req, res) {
  var args = [this.formatSearchString(req.param("string"))];
  when.all([
    db.runQuery("find_event_places_by_name", args),
    db.runQuery("find_event_things_by_name", args)
  ]).then(
    _.bind(this.handleSearchResults, this, res),
    function () {
      winston.error("failed to process /type request", arguments);
    }
  );
};

Search.prototype.formatSearchString = function (searchTerm) {
  return "%" + searchTerm.replace(/\s+/g, "%") + "%";
};

Search.prototype.handleSearchResults = function (res, results) {
  var places = results[0].rows;
  var events = results[1].rows;
  var all = places.concat(events);
  all.sort(function (a, b) {
    var e1 = a.event_count;
    var e2 = b.event_count;

    var n1 = a.thing_name;
    var n2 = b.thing_name;

    return e1 < e2 ? 1 : (e1 === e2 ? (n1 > n2 ? 1 : (n1 === n2 ? 0 : -1)) : -1);
  });
  all = _.unique(all, true, function (x) {
    return x.thing_name;
  });
  all = _.map(all, function (x) {
    if (/^BOX\(/.test(x.area)) {
      var str = x.area.substring(4, x.area.length - 1).toString();
      var edges = str.split(",");
      var first = edges[0].split(" ");

      x.area = [{
        lat: parseFloat(first[1]),
        lon: parseFloat(first[0])
      }];
      if (edges[0] !== edges[1]) {
        var second = edges[1].split(" ");
        x.area.push({
          lat: parseFloat(second[1]),
          lon: parseFloat(second[0])
        });
      }
    }
    return x;
  });
  res.send(all);
};

module.exports = Search;