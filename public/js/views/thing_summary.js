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

      this.model.on("change:highlight change:selectedEventId change:importance change:date", this.update, this);
      this.$(".next").on("click", _.bind(this.showNext, this));
      this.$(".previous").on("click", _.bind(this.showPrevious, this));
    },

    update: function () {
      var highlight = this.model.get("highlight");
      var selectedEventId = this.model.get("selectedEventId");
      if (this.hasHighlightChanged(highlight)) {
        this.highlight = highlight;
        if (!highlight || !highlight.id) {
          this.$el.hide();
        } else if (!highlight.reset) {
          this.updateHighlight();
        }
      } else if (!highlight.reset && !!selectedEventId && (this.lastEventId !== selectedEventId)) {
        this.highlight = highlight;
        this.updateHighlight();
      }
    },

    updateHighlight: function () {
      var selectedEventId = this.model.get("selectedEventId");
      this.points = this.filterPoints(this.highlight.points);
      this.index = this.findIndexForEvent(selectedEventId);
      if (this.highlight.type !== "place") {
        this.$(".name a").text(this.highlight.name);
        this.$(".name a").prop("href", this.highlight.link);
        this.showPoint();
        this.$el.show();
      } else {
        this.$el.hide();
      }
    },

    hasHighlightChanged: function (highlight) {
      if (!highlight || !highlight.id || !this.highlight || (this.highlight.id !== highlight.id)) {
        return true;
      }
      var points = this.filterPoints(highlight.points);
      if (!this.points || this.points.length !== points.length) {
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

    findIndexForEvent: function (eventId) {
      var index;
      var found = _.find(this.points, function (point, i) {
        index = i;
        return point.event_id === eventId;
      });
      if (found) {
        return index;
      }
      return -1;
    },

    showNext: function () {
      this.index = Math.min(this.index + 1, this.points.length);
      if (this.index === this.points.length) {
        this.index = -1;
      }
      this.showPoint(true);
      this.sendAnalytics("next");
    },

    showPrevious: function () {
      this.index = Math.max(-2, this.index - 1);
      if (this.index === -2) {
        this.index = this.points.length - 1;
      }
      this.showPoint(true);
      this.sendAnalytics("previous");
    },

    sendAnalytics: function (direction) {
      var data = _.extend({
        direction: direction,
        index: this.index
      }, this.highlight);
      if (this.index >= 0) {
        var point = data.points[this.index];
        _.each(point, function (value, key) {
          data["point_" + key] = value;
        });
      }
      delete data.points;
      delete data.area;
      analytics.thingSummary_scroll(data);
    },

    showPoint: function (setPosition) {
      this.$(".current-event-name").removeClass("long-text");
      if (this.index === -1) {
        this.model.unset("selectedEventId");
        this.lastEventId = null;
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
        this.$(".current-place").hide();
        this.$(".current-event-name").text(summaryText);
        this.$(".current-event-link").hide();
        this.$(".current-event-name.no-link").show();
        if (setPosition) {
          this.model.set(Highlight.determineModelBounds(this.highlight.area));
        }
      } else {
        var point = this.points[this.index];
        this.model.set("selectedEventId", point.event_id);
        this.lastEventId = point.event_id;
        this.$(".current-date").text(this.getDateTimeRange(point));
        this.$(".current-place").show();
        this.$(".current-place").text(point.place_name);
        this.$(".current-event-name").text(point.event_name);
        this.$(".current-event-link").attr("href", point.event_link);
        if (point.event_link.length > 0) {
          this.$(".current-event-link").show();
          this.$(".current-event-name.no-link").hide();
        } else {
          this.$(".current-event-link").hide();
          this.$(".current-event-name.no-link").show();
        }
        if (point.event_name.length > 60) {
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
            var otherPoint = this.getOtherInterestingPoint();
            var area = this.getArea(point, otherPoint);
            this.model.set(Highlight.determineModelBounds(area));
          }
        }
      }
    },

    getOtherInterestingPoint: function () {
      var diff = 1;
      var noneInRange = false;
      var beforeInRange = true;
      var afterInRange = true;
      while (!noneInRange) {
        if (this.index - diff >= 0) {
          if (this.isInterestingPoint(this.index - diff)) {
            return this.points[this.index - diff];
          }
        } else {
          beforeInRange = false;
        }

        if (this.index + diff < this.points.length) {

          if (this.isInterestingPoint(this.index + diff)) {
            return this.points[this.index + diff];
          }
        } else {
          afterInRange = false;
        }

        diff += 1;
        noneInRange = !(beforeInRange || afterInRange);
      }
      return this.points[this.index - 1];
    },

    isInterestingPoint: function (index) {
      var point = this.points[this.index];
      var otherPoint = this.points[index];
      return (point.lat !== otherPoint.lat) ||
        (point.lon !== otherPoint.lon);
    },

    getArea: function (centre, previous) {
      var latDiff = Math.abs(centre.lat - previous.lat);
      var lonDiff = Math.abs(centre.lon - previous.lon);

      latDiff = latDiff > 5 ? 5 : latDiff;
      lonDiff = lonDiff > 5 ? 5 : lonDiff;

      latDiff = latDiff < 0.01 ? 0.01 : latDiff;
      lonDiff = lonDiff < 0.01 ? 0.01 : lonDiff;

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
      return moment(point[datePrefix + "_date"])
        .add("seconds", point[datePrefix + "_offset_seconds"])
        .add("minutes", this.getTimezoneOffset(new Date(point[datePrefix + "_date"])));
    },

    getTimezoneOffset: function (date) {
      return new Date(date).getTimezoneOffset();
    }

  });

  return ThingSummary;
});