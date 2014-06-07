define([
  "jquery",
  "underscore",
  "backbone",
  "utils/highlight",
  "moment",
  "analytics",
  "text!templates/thing_summary.htm",
  "moment-range",
  "less!../../css/thing_summary"
], function ($, _, Backbone, Highlight, moment, analytics, template) {

  template = _.template(template);

  var ThingSummary = Backbone.View.extend({
    el: "#thing-summary",

    initialize: function () {

    },

    render: function () {
      this.$el.html(template());
      this.update();

      this.model.on("change:highlight change:importance change:date", this.update, this);
      this.$(".next").on("click", _.bind(this.showNext, this));
      this.$(".previous").on("click", _.bind(this.showPrevious, this));
    },

    update: function () {
      var highlight = this.model.get("highlight");
      if (this.hasHighlightChanged(highlight)) {
        this.highlight = highlight;
        if (!highlight) {
          this.$el.hide();
        } else {
          this.points = this.filterPoints(this.highlight.points);
          this.index = -1;
          if (this.highlight.type !== "place") {
            this.$(".name a").text(this.highlight.name);
            this.$(".name a").prop("href", this.highlight.link);
            this.showPoint();
            this.$el.show();
          } else {
            this.$el.hide();
          }
        }
      }
    },

    hasHighlightChanged: function (highlight) {
      if (!highlight || !this.highlight || (this.highlight.id !== highlight.id)) {
        return true;
      }
      var points = this.filterPoints(highlight.points);
      if (this.points.length !== points.length) {
        return true;
      }
      return false;
    },

    filterPoints: function (points) {
      var importance = this.model.get("importance");
      var date = this.model.get("date");
      var start = moment({y: date[0]});
      var end = moment({y: date[1]}).endOf("year");
      return _.filter(points, function (point) {
        return point.importance_value >= importance &&
          !(
             moment(point.start_date).isBefore(start) ||
             moment(point.end_date).isAfter(end)
          );
      });
    },

    showNext: function () {
      this.index = Math.min(this.index + 1, this.points.length);
      if (this.index === this.points.length) {
        this.index = -1;
      }
      this.showPoint(true);
      analytics.thingSummary_scroll(_.extend({
        direction: "next",
        index: this.index
      }, this.highlight));
    },

    showPrevious: function () {
      this.index = Math.max(-2, this.index - 1);
      if (this.index === -2) {
        this.index = this.points.length - 1;
      }
      this.showPoint(true);
      analytics.thingSummary_scroll(_.extend({
        direction: "previous",
        index: this.index
      }, this.highlight));
    },

    showPoint: function (setPosition) {
      this.$(".current-event-name").removeClass("long-text");
      if (this.index === -1) {
        this.model.unset("selectedPointIndex");
        var dateText = "";
        var summaryText;
        if (this.points.length === 1) {
          dateText = this.getDateRange(this.points[0]);
          summaryText = "1 event";
        } else {
          if (this.points.length > 0) {
            dateText = this.getEventDateRange();
          }
          summaryText = this.points.length + " events";
        }
        this.$(".current-date").text(dateText);
        this.$(".current-event-name").text(summaryText);
        if (setPosition) {
          this.model.set(Highlight.determineModelBounds(this.highlight.area));
        }
      } else {
        this.model.set("selectedPointIndex", this.index);
        var point = this.points[this.index];
        this.$(".current-date").text(this.getDateTimeRange(point));
        this.$(".current-event-name").text(point.event_name);
        if (point.event_name.length > 40) {
          this.$(".current-event-name").addClass("long-text");
        }
        if (setPosition) {
          if (this.index === 0) {
            this.model.set({
              zoom: 8,
              center: [
                point.lat,
                point.lon
              ]
            });
          } else {
            var area = this.getArea(point, this.points[this.index - 1]);
            this.model.set(Highlight.determineModelBounds(area));
          }
        }
      }
    },

    getArea: function (centre, previous) {
      var latDiff = centre.lat - previous.lat;
      var lonDiff = centre.lon - previous.lon;

      return [
        {
          lat: centre.lat - latDiff,
          lon: centre.lon - lonDiff
        },
        {
          lat: centre.lat + latDiff,
          lon: centre.lon + lonDiff
        }
      ];
    },

    getEventDateRange: function () {
      return [
        this.getDate(this.points[0], "start"),
        this.getDate(this.points[this.points.length - 1], "end")
      ].join(" – ");
    },

    getDateTimeRange: function (point) {
      if (this.isLongerThanOneDay(point)) {
        return this.getDate(point, "start") + " – " + this.getDate(point, "end");
      } else {
        var timeRange = [
          this.getTime(point, "start"),
          this.getTime(point, "end")
        ].join(" – ");
        if (timeRange === "00:00 – 23:59") {
          return this.getDate(point, "start");
        } else {
          return [
            timeRange,
            this.getDate(point, "start")
          ].join(" ");
        }
      }
    },

    getDateRange: function (point) {
      if (this.isLongerThanOneDay(point)) {
        return this.getDate(point, "start") + " – " + this.getDate(point, "end");
      } else {
        return this.getDate(point, "start");
      }
    },

    isLongerThanOneDay: function (point) {
      var range = moment().range(
        this.getOffsetMoment(point, "start"),
        this.getOffsetMoment(point, "end")
      );

      var oneDay = moment().range(
        moment({y: 2000, m: 1, d: 1}),
        moment({y: 2000, m: 1, d: 2})
      );

      return range > oneDay;
    },

    getDate: function (point, datePrefix) {
      return this.getOffsetMoment(point, datePrefix).format("ll");
    },

    getTime: function (point, datePrefix) {
      return this.getOffsetMoment(point, datePrefix).format("HH:mm");
    },

    getOffsetMoment: function (point, datePrefix) {
      return moment(point[datePrefix + "_date"]).add("seconds", point[datePrefix + "_offset_seconds"]);
    }

  });

  return ThingSummary;
});