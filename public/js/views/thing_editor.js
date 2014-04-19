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

      this.addValidators();

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
      this.subtypeSelectors = {};
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

    addValidators: function () {

      window.ParsleyValidator
        .addValidator("duplicatesubtypes", _.bind(function () {
          var subtypes = _.chain(this.getSubtypeValues()).pluck("type").pluck("id").value();
          return subtypes.length === _.uniq(subtypes).length;
        }, this), 32)
        .addMessage("en", "duplicatesubtypes", "You cannot add duplicate subtypes");

    },

    validate: function () {
      var ok = true;

      ok = this.validateType() && ok;
      ok = this.validateSubtypeDuplication() && ok;
      ok = this.validateSubtypeExistence() && ok;
      ok = this.validateSubtypes() && ok;

      return ok;
    },

    validateType: function () {
      return !_.isArray(this.$("input[data-key=thing-type]").parsley().validate());
    },

    validateSubtypeDuplication: function () {
      return !_.isArray(this.$("input[data-key=subtypes-dummy]").parsley().validate());
    },

    validateSubtypeExistence: function () {
      //this shouldn't be possible UI-wise,
      //but can't hurt to double check
      return _.keys(this.subtypeSelectors).length > 0;
    },

    validateSubtypes: function () {
      return _.every(this.subtypeSelectors, function (typeSelector) {
        return typeSelector.validate();
      });
    }
  });

  return ThingEditor;
});