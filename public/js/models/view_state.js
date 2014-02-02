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
        if (!this.get("highlight")) {
          this.set("highlight", {});
        }
      },

      filterStateExists: function (id) {
        return !!this.get("filterState").get(id);
      },
      filterChanged: function (filter, checked) {
        this.trigger("filterChanged", filter, checked);
      },
      filterStateExists: function (id) {
        return !!this.get("filterState").get(id);
      },
      getFilterState: function (id) {
        return this.get("filterState").get(id);
      },
      removeFilterStateKey: function (id, silent) {
        this.get("filterState").remove(id, {silent: !!silent});
      },
      addFilterStateKey: function (id, parentType, silent) {
        var model = {
          id: id
        };
        if (parentType) {
          model.parent_type = parentType;
        }
        this.get("filterState").set([model], {remove: false, silent: !!silent});
      },
      isPrimaryFilterStateUsed: function (id) {
        return this.get("filterState").any(function (thingType) {
          return thingType.get("parent_type") === id;
        });
      }

    });
    return ViewState;
  }
);
