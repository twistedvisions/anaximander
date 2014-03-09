define([
  "jquery",
  "underscore",
  "backbone",
  "views/type_selector",
  "collections/types",
  "collections/subtypes",
  "text!templates/thing_editor.htm"
], function ($, _, Backbone, TypeSelector, TypesCollection, SubtypesCollection, template) {

  var ThingEditor = Backbone.View.extend({

    className: "thing-editor",

    subtypeId: 0,

    initialize: function (options) {
      this.name = options.name;
      this.types = TypesCollection.instance;
      this.subtypes = new SubtypesCollection();
      this.subtypeSelectors = {};
    },

    render: function () {
      this.$el.html(template);
      this.$("input[data-key=thing-name]").val(this.name);

      this.$("input[data-key=thing-type]").select2({
        placeholder: "Select the type of thing this is",
        data: this.types.map(function (type) {
          return {
            id: type.id,
            text: type.get("name")
          };
        })
      });
      this.$("input[data-key=thing-type]").val("").trigger("change");
      this.$("input[data-key=thing-type]").on("change", _.bind(this.typeSelected, this));
      this.$(".subtypes-holder").hide();
      this.$(".add-subtype").on("click", _.bind(this.addSubtype, this));
      return this.$el;
    },

    typeSelected: function () {
      this.subtypes.updateData({
        id: this.$("input[data-key=thing-type]").val()
      }).then(_.bind(this.showSubtypes, this));
      this.$(".subtypes-holder").show();
    },

    showSubtypes: function () {
      this.$(".subtypes").html("");
      this.addSubtype();
    },

    addSubtype: function () {
      this.subtypeId += 1;
      var subtypeId = this.subtypeId;
      this.subtypeSelector = new TypeSelector({
        type: "thing subtype",
        typePlaceholder: "Select or add a subtype",
        importancePlaceholder: "Select or add an importance",
        types: this.subtypes,
        importanceDisplay: "inline-block"
      });
      this.subtypeSelectors[subtypeId] = this.subtypeSelector;
      var holder = $("<div class='subtype' data-id='" + subtypeId + "'></div>");
      var remove = $("<a class='remove-subtype glyphicon glyphicon-remove'></a>");
      holder.append(remove);
      holder.append(this.subtypeSelector.render());
      remove.on("click", _.bind(function (subtypeId) {
        holder.remove();
        delete this.subtypeSelectors[subtypeId];
      }, this, subtypeId));
      this.$(".subtypes").append(holder);
    },

    getValue: function () {
      var value = {
        name: this.$("input[data-key=thing-name]").val(),
        link: this.$("input[data-key=thing-link]").val(),
        typeId: parseInt(this.$("input[data-key=thing-type]").val(), 10),
        subtypes: this.getSubtypeValues()
      };
      return value;
    },

    getSubtypeValues: function () {
      return _.map(this.subtypeSelectors, function (typeSelector) {
        return typeSelector.getValue();
      });
    },

    validate: function () {
      return !!_.find(this.subtypeSelectors, function (typeSelector) {
        return !typeSelector.validate();
      });
    }
  });

  return ThingEditor;
});