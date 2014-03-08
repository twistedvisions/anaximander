define([
  "jquery",
  "underscore",
  "backbone",
  "text!templates/type_selector.htm"
], function ($, _, Backbone, template) {

  var TypeSelector = Backbone.View.extend({

    className: "type-selector",

    initialize: function (options) {
      this.types = options.types;
      this.typePlaceholder = options.typePlaceholder;
      this.importancePlaceholder = options.importancePlaceholder;
      this.importanceDisplay = options.importanceDisplay;

      this.importanceSelectData = {
        placeholder: this.importancePlaceholder,
        data: [],
        createSearchChoice: function (text) {
          return {
            id: -1,
            text: text
          };
        }
      };
    },

    render: function () {
      this.$el.html(template);
      this.setImportanceSelectMode(true, true);
      this.renderTypes();
      this.renderTypeImportances();
      return this.$el;
    },

    renderTypes: function () {
      this.$("input[data-key=type]").select2({
        placeholder: this.typePlaceholder,
        data: this.types.map(function (type) {
          return {
            id: type.id,
            text: type.get("name")
          };
        }),
        createSearchChoice: function (text) {
          return {
            id: -1,
            text: text
          };
        }
      });
    },

    renderTypeImportances: function () {
      this.$("input[data-key=importance]").select2(this.importanceSelectData);
      this.$("input[data-key=importance]").on("change",
        _.bind(this.updateTypeImportanceCreator, this));
      this.$("input[data-key=type]").on("change",
        _.bind(this.updateTypeImportance, this));
      this.$(".importance-group .remove").click(_.bind(this.hideImportanceGroup, this));

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
        var type = this.types.get(typeId);
        var importances = type.get("importances");
        this.$("input[data-key=importance]").select2(
          _.extend(this.importanceSelectData, {
          data: _.map(importances, function (type) {
            return {
              id: type.id,
              text: type.name
            };
          })
        }));
        var defaultImportanceId = type.get("default_importance_id");
        this.$("input[data-key=importance]").val(defaultImportanceId).trigger("change");
      } else {
        this.$("input[data-key=importance]").select2(
          _.extend(this.importanceSelectData, {
          data: [{
            id: -1,
            text: "Nominal"
          }]
        }));
        this.$("input[data-key=importance]").val(-1).trigger("change");
      }
      this.setImportanceSelectMode(true, true);
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
      data.name = data.text;
      delete data.text;
      return data;
    },

    getImportanceValue: function () {
      var value;
      if (this.selectMode) {
        value = this.$("input[data-key=importance]").select2("data");
      } else {
        value = {
          id: -1,
          name: this.$("input[data-key=importance-name]").val(),
          description: this.$("textarea[data-key=importance-description]").val(),
          value: this.$("input[data-key=importance-value]").val()
        };
      }
      return value;
    },

    validate: function () {
      var ok = true;
      ok = ok && this.$("input[data-key=type]").parsley("validate");
      if (this.selectMode) {
        ok = ok && this.$("input[data-key=importance]").parsley("validate");
      } else {
        ok = ok && this.$("input[data-key=importance-name]").parsley("validate");
        ok = ok && this.$("textarea[data-key=importance-description]").parsley("validate");
        ok = ok && this.$("input[data-key=importance-value]").parsley("validate");
      }
      return ok;
    }

  });

  return TypeSelector;
});