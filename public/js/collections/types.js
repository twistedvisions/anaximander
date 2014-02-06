define([
  "underscore",
  "backbone",
  "models/type"
], function (_, Backbone, Type) {

  var types = Backbone.Collection.extend({

    model: Type,

    url: "/type",

    initialize: function () {

    },

    setHighlighted: function (type) {
      this.highlighted = type;
      this.trigger("highlightChanged", type);
    },

    setSelected: function (type, isSelected) {
      this.selected = type;
      this.trigger("selectionChanged", type, isSelected);
    },

    parse: function (results) {
      results = _.map(results, function (x) {
        x.name = _.string.capitalize(x.name);
        return x;
      });
      return results;
    }

  });
  return types;
});