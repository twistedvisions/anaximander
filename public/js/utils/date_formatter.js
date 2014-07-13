define(["moment", "moment-range"], function (moment) {

  return {

    formatDateRange: function (start, end) {
      start = moment(start);
      end = moment(end);
      if (start.isSame(end, "day")) {
        return this.getDateString(start);
      } else {
        return [
          this.getDateString(start, true) +
            ((start.get("year") <= 0 && end.get("year") > 0) ? " BCE" : ""),
          "\u2013",
          this.getDateString(end, true) +
            ((start.get("year") <= 0 && end.get("year") > 0) ?
              " CE" :
              end.get("year") <= 0 ? " BCE" : "")
        ].join(" ");
      }
    },

    formatDateTimeRange: function (start, end) {
      start = moment(start);
      end = moment(end);

      if (this.isLongerThanOneDay(start, end)) {
        return this.formatDateRange(start, end);
      } else {
        var timeRange = [
          this.getTimeString(start),
          this.getTimeString(end)
        ].join(" \u2013 ");
        if (timeRange === "00:00 \u2013 23:59") {
          return this.getDateString(start);
        } else {
          return [
            timeRange,
            this.getDateString(end)
          ].join(" ");
        }
      }
    },

    isLongerThanOneDay: function (start, end) {
      var range = moment().range(start, end);

      var oneDay = moment().range(
        moment({y: 2000, m: 1, d: 1}),
        moment({y: 2000, m: 1, d: 2})
      );

      return range > oneDay;
    },

    getDateString: function (date, omitEra) {
      return [
        date.format("DD/MM/YYYY").replace("-", ""),
        (!omitEra && date.get("year") <= 0) ? " BCE" : ""
      ].join("");
    },

    getTimeString: function (date) {
      return date.format("HH:mm");
    }

  };

});
