define([
  "jquery",
  "underscore",
  "backbone",
  "./analytics"
], function ($, _, Backbone, analytics) {
  var Router = Backbone.Router.extend({
    
    routes: {
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end": "mapView"
    },

    mapView: function (lat, lon, zoom, start, end) {
      var data = {
        date: [start, end],
        center: [lat, lon],
        zoom: parseInt(zoom, 10)
      };

      window.lastEvent = "url_change";

      this.model.set(data);
    },

    init: function (options) {
      this.model = options.model;
      this.model.on("change", function () {

        var date = this.model.get("date");
        var center = this.model.get("center");
        var zoom = this.model.get("zoom");

        this.navigate([
          "lat", center[0],
          "lon", center[1],
          "zoom", zoom,
          "start", date[0],
          "end", date[1]
        ].join("/"));

        analytics.navigation({
          lat: center[0],
          lon: center[1],
          zoom: zoom,
          start: parseInt(date[0], 10),
          end: parseInt(date[1], 10)
        });

      }, this);

      Backbone.history.start();
    }
  });

  return Router;
});