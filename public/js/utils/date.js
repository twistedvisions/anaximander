define([], function () {
  return {
    formatYearAsTimestamp: function (year, suffix) {
      var isBc = year < 0;
      year = this.formatYear(year) + suffix + (isBc ? " BC" : "");
      return isBc ? year.substring(1) : year;
    },

    formatYear: function (year) {
      return this.pad(Math.abs(year), year < 0 ? 5 : 4, 0);
    },

    pad: function (n, width, z) {
      z = z || "0";
      n = n + "";
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }
  };
});