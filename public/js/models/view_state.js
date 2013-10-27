define([
    "backbone"
  ], function (Backbone) {
    var ViewState = Backbone.Model.extend({
      initialize: function () {
        var filterState = new Backbone.Collection();
        filterState.on("add", function () {
          this.trigger("change");
        }, this);
        filterState.on("remove", function () {
          this.trigger("change");
        }, this);
        this.set("filterState", filterState);
      }
    });
    return ViewState;
  }
);





