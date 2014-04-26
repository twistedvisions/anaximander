define([
  "jquery",
  "underscore",
  "backbone",
  "models/thing",
  "collections/things",
  "views/thing_editor",
  "analytics",
  "text!templates/thing_editor_modal.htm",
  "bootstrap",
  "datetimepicker",
  "parsley",
  "css!/css/thing_editor_modal",
  "css!/css/select2-bootstrap",
  "css!/css/datetimepicker"
], function ($, _, Backbone,
    Thing, ThingsCollection,
    ThingEditor,
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
      this.show();

      return this.$el;
    },

    show: function () {
      $("body").append(this.$el);
      this.$(".modal").modal();
      this.$(".modal").modal("show");
    }

  });

  return ThingEditorModal;

});
