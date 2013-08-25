define([
  "jquery",
  "underscore",
  "backbone"
], function ($, _, Backbone) {
  var AppRouter = Backbone.Router.extend({
    routes: {
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end": "mapView"
    },
    mapView: function (lat, lon, zoom, start, end) {
      this.model.set({
        date: [start, end],
        center: [lat, lon],
        zoom: parseInt(zoom, 10)
      });
    }
  });

  var initialize = function (options) {

    var appView = options.appView;
    this.model = options.model;
    var router = new AppRouter(options);
    router.model = this.model;
    this.model.on("change", function () {
      var date = this.model.get("date");
      var center = this.model.get("center");
      var zoom = this.model.get("zoom");
      router.navigate([
        "lat", center[0],
        "lon", center[1],
        "zoom", zoom,
        "start", date[0],
        "end", date[1]
      ].join("/"));
    }, this);

    Backbone.history.start();
  };
  return {
    initialize: initialize
  };
});