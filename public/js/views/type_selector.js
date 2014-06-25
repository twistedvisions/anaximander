define([
  "jquery",
  "underscore",
  "backbone",
  "analytics",
  "models/current_user",
  "text!templates/type_selector.htm"
], function ($, _, Backbone, Analytics, User, template) {

  var TypeSelector = Backbone.View.extend({

    className: "type-selector",

    initialize: function (options) {
      this.types = options.types;
      this.typePlaceholder = options.typePlaceholder;
      this.importancePlaceholder = options.importancePlaceholder;
      this.importanceDisplay = options.importanceDisplay;
      this.defaultNewImportanceName = "Nominal";
      this.defaultNewImportanceDescription = "a default value of importance";
      this.defaultNewImportanceValue = 5;
    },

    getImportanceSelectOptions: function () {
      var options = {
        placeholder: this.importancePlaceholder,
        data: []
      };
      if (User.user.hasPermission("add-importance")) {
        options.createSearchChoice = function (text) {
          return {
            id: -1,
            text: text
          };
        };
      }
      return options;
    },

    render: function () {
      this.$el.html(template);
      this.setImportanceSelectMode(true, true);
      this.renderTypes();
      this.renderTypeImportances();
      this.addValidators();
      return this.$el;
    },

    renderTypes: function () {
      this.$("input[data-key=type]").select2(this.getTypeSelectOptions());
    },

    getTypeSelectOptions: function () {
      var options = {
        placeholder: this.typePlaceholder,
        data: this.types.map(function (type) {
          return {
            id: type.id,
            text: type.get("name")
          };
        })
      };
      if (User.user.hasPermission("add-type")) {
        options.createSearchChoice = function (text) {
          return {
            id: -1,
            text: text
          };
        };
      }
      return options;
    },

    renderTypeImportances: function () {
      this.$("input[data-key=importance]").select2(this.getImportanceSelectOptions());
      this.$("input[data-key=importance]").on("change",
        _.bind(this.updateTypeImportanceCreator, this));
      this.$("input[data-key=type]").on("change",
        _.bind(this.updateTypeImportance, this));
      this.$("input[data-key=type]").on("change",
        _.bind(this.triggerUpdates, this));
      this.$(".importance-group .remove").click(_.bind(this.hideImportanceGroup, this));

    },

    triggerUpdates: function () {
      var typeId = parseInt(this.$("input[data-key=type]").val(), 10);
      this.trigger("change:type", typeId);
    },

    hideImportanceGroup: function (e) {
      e.preventDefault();
      this.setImportanceSelectMode(true);
    },

    updateTypeImportanceCreator: function () {
      var typeImportanceId = parseInt(this.$("input[data-key=importance]").val(), 10);
      if (typeImportanceId === -1) {
        var name = this.$("input[data-key=importance]").select2("data").text;
        this.$("input[data-key=importance-name]").val(name);
        this.setImportanceSelectMode(false);
        if (name !== this.defaultNewImportanceName) {
          Analytics.newImportanceAdded({
            type: this.typeName,
            name: name
          });
        }
      } else {
        this.setImportanceSelectMode(true, true);
      }
    },

    setImportanceSelectMode: function (selectMode, dontUpdate) {
      if (selectMode) {
        if (!dontUpdate) {
          this.updateTypeImportance();
        }
        this.$el.addClass("selecting-importance");
        this.$el.removeClass("editing-importance");
        this.$(".importance-group").hide();
        if (!this.importanceDisplay) {
          this.$("input[data-key=importance]").parent().show();
        } else {
          this.$("input[data-key=importance]").parent().css("display", this.importanceDisplay);
        }
        this.fillUnrequiredFields();
      } else {
        this.$el.removeClass("selecting-importance");
        this.$el.addClass("editing-importance");
        this.$(".importance-group").show();
        this.$("input[data-key=importance]").parent().hide();
        this.emptyUnrequiredFields();
      }
      this.selectMode = selectMode;
    },

    fillUnrequiredFields: function () {
      this.$("input[data-key=importance-name]").val("a");
      this.$("textarea[data-key=importance-description]").val("a");
      this.$("input[data-key=importance-value]").val(1);
    },

    emptyUnrequiredFields: function () {
      this.$("textarea[data-key=importance-description]").val("");
      this.$("input[data-key=importance-value]").val(5);
    },

    updateTypeImportance: function () {
      var typeId = parseInt(this.$("input[data-key=type]").val(), 10);
      if (typeId !== -1) {
        this.setImportancesForExistingType(typeId);
      } else {
        this.setImportancesForNewType();
      }
      this.setImportanceSelectMode(true, true);
    },

    setImportancesForExistingType: function (typeId) {
      var type = this.types.get(typeId);
      this.setImportanceDropdownValues(type.get("importances"));
      var defaultImportanceId = type.get("default_importance_id");
      this.$("input[data-key=importance]").val(defaultImportanceId).trigger("change");
    },

    setImportanceDropdownValues: function (importances) {
      this.$("input[data-key=importance]").select2(
        _.extend(_.clone(this.getImportanceSelectOptions()), {
        data: _.map(importances, function (type) {
          return {
            id: type.id,
            text: type.name
          };
        })
      }));
    },

    setImportancesForNewType: function () {
      this.setDefaultNewImportanceValue();
      Analytics.newTypeAdded({
        type: this.typeName,
        name: name
      });
    },

    setDefaultNewImportanceValue: function () {
      this.$("input[data-key=importance]").select2(
        _.extend(_.clone(this.getImportanceSelectOptions()), {
        data: [{
          id: -2,
          text: this.defaultNewImportanceName
        }]
      }));
      this.$("input[data-key=importance]").select2("val", -2).trigger("change");
    },

    updateTypes: function () {
      this.$("input[data-key=type]").select2("val", "");
      this.$("input[data-key=type]").select2(
        _.extend(_.clone(this.getTypeSelectOptions()), {
        data: this.types.map(function (type) {
          return {
            id: type.id,
            text: type.get("name")
          };
        })
      }));
      this.$("input[data-key=importance]").select2("val", "");
    },

    setValue: function (typeId, importanceId) {
      this.$("input[data-key=type]").select2("val", typeId).trigger("change");
      this.updateTypeImportance();
      this.$("input[data-key=importance]").select2("val", importanceId).trigger("change");
    },

    getValue: function () {
      var value = {
        type: this.getTypeValue(),
        importance: this.getImportanceValue()
      };
      return value;
    },

    getTypeValue: function () {
      var data = _.clone(this.$("input[data-key=type]").select2("data"));
      if (data.id < 0) {
        data.name = data.text;
      }
      delete data.text;
      return data;
    },

    getImportanceValue: function () {
      var value;
      if (this.selectMode) {
        value = _.clone(this.$("input[data-key=importance]").select2("data"));
        if (value.id < 0) {
          value.name = value.text;
          value.description = this.defaultNewImportanceDescription + " for " + this.getTypeName();
          value.value = this.defaultNewImportanceValue;
        }
        delete value.text;
      } else {
        value = {
          id: -1,
          name: this.$("input[data-key=importance-name]").val(),
          description: this.$("textarea[data-key=importance-description]").val(),
          value: parseInt(this.$("input[data-key=importance-value]").val(), 10)
        };
      }
      return value;
    },

    getTypeName: function () {
      return this.$("input[data-key=type]").select2("data").text;
    },

    addValidators: function () {
      window.ParsleyValidator
        .addValidator("notnominal", function (name) {
          return name.trim().toLowerCase() !== "nominal";
        }, 32)
        .addMessage("en", "notnominal", "Do not create custom nominal importances");

    },

    validate: function () {
      var ok = true;
      ok = ok && !_.isArray(this.$("input[data-key=type]").parsley().validate());
      if (this.selectMode) {
        ok = ok && !_.isArray(this.$("input[data-key=importance]").parsley().validate());
      } else {
        ok = ok && !_.isArray(this.$("input[data-key=importance-name]").parsley().validate());
        ok = ok && !_.isArray(this.$("textarea[data-key=importance-description]").parsley().validate());
        ok = ok && !_.isArray(this.$("input[data-key=importance-value]").parsley().validate());
      }
      return ok;
    }

  });

  return TypeSelector;
});