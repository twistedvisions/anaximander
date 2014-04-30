define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "models/thing",
  "collections/things",
  "views/thing_editor",
  "utils/history_renderer",
  "analytics",
  "text!templates/thing_editor_modal.htm",
  "bootstrap",
  "datetimepicker",
  "parsley",
  "css!/css/thing_editor_modal",
  "css!/css/select2-bootstrap",
  "css!/css/datetimepicker"
], function ($, _, Backbone, when,
    Thing, ThingsCollection,
    ThingEditor, HistoryRenderer,
    analytics, template) {

  var ThingEditorModal = Backbone.View.extend({
    className: "",

    initialize: function (options) {
      this.state = options.state;
      this.thingEditor = new ThingEditor({
        model: this.model
      });
    },

    render: function () {
      this.$el.html(template);

      this.$("form").prepend(this.thingEditor.render());

      this.$(".save").on("click", _.bind(this.handleSave, this));
      this.$(".nav .history a").on("click", _.bind(this.showHistoryTab, this));

      this.show();

      this.addValidators();

      return this.$el;
    },

    showHistoryTab: function () {
      if (!this.historyCollection) {
        this.fetchHistory().then(_.bind(this.renderHistory, this));
      }
    },

    fetchHistory: function () {
      this.historyCollection = new (Backbone.Collection.extend({
        url: "thing/" + this.model.id + "/change",
        parse: function (changes) {
          return _.map(changes, function (change) {
            change.date = new Date(change.date);
            return change;
          });
        }
      }))();
      return when(this.historyCollection.fetch());
    },

    renderHistory: function () {
      this.$(".tab-pane.history").append(HistoryRenderer(this.historyCollection));
    },

    show: function () {
      $("body").append(this.$el);
      this.$(".modal").modal();
      this.$(".modal").modal("show");
    },

    addValidators: function () {
      window.ParsleyValidator
        .addValidator("changemade", _.bind(function () {
          if (this.model) {
            return this.model.hasDifferences(this.collectValues());
          } else {
            return true;
          }
        }, this), 3)
        .addMessage("en", "changemade", "No changes made");
    },

    collectValues: function () {
      return this.thingEditor.getValue();
    },

    handleSave: function () {
      analytics.thingSaveClicked(this.model ? this.model.toJSON() : {
        name: this.$el.find("input[data-key=name]").val()
      });
      if (this.validate()) {
        var values = this.collectValues();
        var reason = this.$("textarea[data-key=reason]").val();
        this.model.update(values, reason).then(
          _.bind(this.handleSaveComplete, this, values),
          _.bind(this.handleSaveFail, this, null)
        );
      }
    },

    validate: function () {
      var ok = true;
      this.$(".error-message").hide();

      ok = ok && this.$("form").parsley().validate();
      ok = ok && this.thingEditor.validate();

      return ok;
    },

    handleSaveComplete: function (values) {
      analytics.thingSaved(values);

      this.hide();

      //force a refresh of data
      this.state.trigger("change:center");
    },

    hide: function () {
      this.$el.find(".modal").modal("hide");
    },

    handleSaveFail: function (model, res) {
      this.$(".error-message").show();
      var text;
      if (res.responseText.indexOf("last_edited times do not match") >= 0) {
        text = "Thing can't be saved - it has been edited by someone else. Refresh and try again";
      } else {
        text = res.responseText.substring(0, 100);
      }
      this.$(".error-message").text(text);
    }

  });

  return ThingEditorModal;

});
