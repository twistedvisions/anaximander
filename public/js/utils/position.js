define([], function () {

  return {
    normalisePosition: function (x) {
      while (x < 180) {
        x += 360;
      }
      while (x > 180) {
        x -= 360;
      }
      return x;
    },

    getCenter: function (lat1, lon1, lat2, lon2) {
      return [
        (lat1 + lat2) / 2,
        this.midPoint(lon1, lon2)
      ];
    },

    midPoint: function (lon1, lon2) {
      var position = (lon1 + lon2) / 2;
      return (Math.max(lon1, lon2) - position > 90) ?
        position - 180 :
        position;
    }
  };
});