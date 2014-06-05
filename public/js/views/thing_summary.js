define([
  "jquery",
  "underscore",
  "backbone",
  "utils/highlight",
  "moment",
  "text!templates/thing_summary.htm",
  "less!../../css/thing_summary"
], function ($, _, Backbone, Highlight, moment, template) {

  template = _.template(template);

  var ThingSummary = Backbone.View.extend({
    el: "#thing-summary",

    initialize: function () {

    },

    render: function () {
      this.$el.html(template());
      this.update();
      //todo: should be change:highlight, but it doesn't trigger
      this.model.on("change", this.update, this);
      this.$(".next").on("click", _.bind(this.showNext, this));
      this.$(".previous").on("click", _.bind(this.showPrevious, this));
    },

    update: function () {
      var highlight = this.model.get("highlight");
      if (highlight && (!this.highlight || (highlight.id !== this.highlight.id))) {
        this.highlight = highlight;
        this.points = this.highlight.points;
        this.index = -1;
        if (this.highlight.type !== "place") {
          this.$(".name a").text(this.highlight.name);
          this.$(".name a").prop("href", this.highlight.link);
          this.showPoint();
          this.$el.show();
        } else {
          this.$el.hide();
        }
      } else if (!highlight) {
        this.highlight = null;
        this.$el.hide();
      }
    },

    showNext: function () {
      this.index = Math.min(this.index + 1, this.points.length);
      if (this.index === this.points.length) {
        this.index = -1;
      }
      this.showPoint(true);
    },

    showPrevious: function () {
      this.index = Math.max(-2, this.index - 1);
      if (this.index === -2) {
        this.index = this.points.length - 1;
      }
      this.showPoint(true);
    },

    showPoint: function (setPosition) {
      this.$(".current-event-name").removeClass("long-text");
      if (this.index === -1) {
        var dateText;
        var summaryText;
        if (this.points.length === 1) {
          dateText = moment(this.points[0].date).format("ll");
          summaryText = "1 event";
        } else {
          dateText = [
            moment(this.points[0].date).format("ll"),
            moment(this.points[this.points.length - 1].date).format("ll")
          ].join(" - ");
          summaryText = this.points.length + " events";
        }
        this.$(".current-date").text(dateText);
        this.$(".current-event-name").text(summaryText);
        if (setPosition) {
          this.model.set(Highlight.determineModelBounds(this.highlight.area));
        }
      } else {
        var point = this.points[this.index];
        this.$(".current-date").text(moment(point.date).format("lll"));
        this.$(".current-event-name").text(point.event_name);
        if (point.event_name.length > 40) {
          this.$(".current-event-name").addClass("long-text");
        }
        if (setPosition) {
          this.model.set({
            zoom: 8,
            center: [
              point.lat,
              point.lon
            ]
          });
        }
      }
    }

  });

  return ThingSummary;
});