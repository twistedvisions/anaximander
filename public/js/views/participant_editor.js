define([
  "jquery",
  "underscore",
  "backbone",
  "views/type_selector",
  "views/thing_editor",
  "text!templates/participant_editor.htm"
], function ($, _, Backbone, TypeSelector, ThingEditor, template) {

  var ParticipantEditor = Backbone.View.extend({

    className: "participant-editor",

    initialize: function (options) {
      this.roles = options.roles;
    },

    render: function () {
      this.$el.html(_.template(template, this.model.toJSON()));

      if (this.model.id === -1) {
        this.$(".known-thing").remove();
        this.thingEditor = new ThingEditor({
          name: this.model.get("name")
        });
        this.$(".new-thing").append(this.thingEditor.render());
        this.$el.addClass("creating-thing");
      } else {
        this.$(".new-thing").remove();
      }

      this.typeSelector = new TypeSelector({
        typePlaceholder: "Role",
        importancePlaceholder: "Importance",
        types: this.roles,
        importanceDisplay: (this.model.id === -1) ? null : "inline-block",
        id: this.nextParticipantId
      });

      this.$(".form").append(this.typeSelector.render());
      this.$(".remove-participant").on("click",
        _.bind(this.removeParticipant, this));

      return this.$el;
    },

    removeParticipant: function () {
      this.$el.remove();
      this.trigger("removed", this.id);
    },

    getValue: function () {
      var value;

      if (this.model.id === -1)  {
        value = {
          thing: this.thingEditor.getValue()
        };
        value.thing.id = -1;
      } else {
        value = {
          thing: this.model.toJSON()
        };
      }
      return _.extend(value, this.typeSelector.getValue());
    },

    validate: function () {
      return this.typeSelector.validate();
    }
  });

  return ParticipantEditor;
});