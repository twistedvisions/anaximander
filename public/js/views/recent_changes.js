define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "utils/history_renderer",
  "analytics",
  "text!templates/recent_changes.htm",
  "less!/css/recent_changes.css"
], function ($, _, Backbone, when, HistoryRenderer, analytics, template) {
  var RecentChanges = Backbone.View.extend({
    className: "recent-changes",
    initialize: function (/*options*/) {},

    render: function () {
      $(this.el).html(template);
      this.getRecentChanges().then(_.bind(this.renderTable, this));
      analytics.recentChangesViewed();
      return this.$el;
    },

    getRecentChanges: function () {
      this.historyCollection = new (Backbone.Collection.extend({
        url: "/change/recent",
        parse: function (changes) {
          return _.map(changes, function (change) {
            change.date = new Date(change.date);
            return change;
          });
        }
      }))();
      return when(this.historyCollection.fetch());
    },

    renderTable: function () {
      this.$(".changes").html(HistoryRenderer(this.historyCollection));
      this.$(".filter input").focus();
      this.$(".filter input").on("keyup", _.bind(this.filterTable, this));
    },

    filterTable: function () {
      var text = this.$(".filter input").val().toLowerCase();
      if (text.length === 0) {
        this.showAllRows();
      } else {
        this.$(".changes tbody tr").each(_.bind(this.filterRow, this, text));
        this.$("tbody > tr:not(.hidden)").parent().find("tr:not(.hidden):first").addClass("show-details");
      }
    },

    showAllRows: function () {
      this.$("table").removeClass("show-all");
      this.$("tbody > tr.hidden").removeClass("hidden");
    },

    filterRow: function (text, index, row) {
      row = $(row);
      this.$("table").addClass("show-all");
      row.removeClass("show-details");
      if (this.containsText(text, row)) {
        row.removeClass("hidden");
      } else {
        row.addClass("hidden");
      }
    },

    containsText: function (text, row) {
      return row.text().toLowerCase().indexOf(text) > 0;
    }
  });
  return RecentChanges;
});