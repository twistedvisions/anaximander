define(["utils/position"], function (Position) {
  return {
    determineModelBounds: function (area) {

      var lat1 = area[0].lat;
      var lat2 = area[1].lat;
      var lon1 = area[0].lon;
      var lon2 = area[1].lon;

      var modelData = {};
      modelData.zoom = -1;
      modelData.center = Position.getCenter(lat1, lon1, lat2, lon2);
      modelData.bounds = this.extractBounds(lat1, lon1, lat2, lon2);
      return modelData;

    },

    extractBounds: function (lat1, lon1, lat2, lon2) {
      var bounds = [{}, {}];

      this.extractBound(bounds, "lon", lon1, lon2);
      this.extractBound(bounds, "lat", lat1, lat2);
      return bounds;
    },

    extractBound: function (bounds, key, a, b) {
      var delta = (b - a) / 10;
      if (b > a) {
        bounds[0][key] = a - delta;
        bounds[1][key] = b + delta;
      } else {
        bounds[0][key] = a + delta;
        bounds[1][key] = b - delta;
      }
      return bounds;
    }

  };
});