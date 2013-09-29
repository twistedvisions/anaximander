define(["underscore"], function (_) {

  var serialiser = {
    serialise: function (model) {
      var filterState = model.get("filterState");
      var filterMap = this.getFilterMap(filterState);
      var formatFilterMapEntry = function (value, key) {
        if (value.length === 0) {
          return key + ":*";
        }
        return key + ":" + value.join(",");
      };
      return _.map(filterMap, formatFilterMapEntry).join(";");
    },
    deserialise: function (string, model) {
      var filterTypes = string.split(";");
      var filters = [];
      _.forEach(filterTypes, function (filterType) {
        var values = filterType.split(":");
        var id = parseInt(values[0], 10);
        if (values[1] === "*") {
          filters.push({id: id});
        } else if (values[1]) {
          var filterSubTypes = values[1].split(",");
          _.forEach(filterSubTypes, function (filterSubType) {
            if (filterSubType === "u") {
              filters.push({id: -id, parent_type: id});
            } else {
              var subTypeId = parseInt(filterSubType, 10);
              filters.push({id: subTypeId, parent_type: id});
            }
          });
        }
      });
      model.get("filterState").set(filters);
      return model;
    },
    getFilterMap: function (filterState) {
      var types = this.getTypeFilterKeys(filterState);
      var notSpecifieds = this.getNotSpecifiedTypeFilterKeys(filterState);
      var subTypes = this.getSubtypeFilterKeys(filterState);
      var filterMap = {};
      _.forEach(types, function (filter) {
        filterMap[filter.id] = [];
      });
      _.forEach(notSpecifieds, function (filter) {
        filterMap[filter.id] = filterMap[filter.id] || [];
        filterMap[filter.id].push("u");
      });
      _.forEach(subTypes, function (filter) {
        filterMap[filter.parent_type] = filterMap[filter.parent_type] || [];
        filterMap[filter.parent_type].push(filter.id);
      });
      return filterMap;
    },
    getTypeFilterKeys: function (filterState) {
      var typeFilters = filterState.filter(function (filter) {
        return !filter.get("parent_type");
      });
      return _.map(typeFilters, function (filter) {
        return filter.toJSON();
      });
    },
    getSubtypeFilterKeys: function (filterState) {
      var typeFilters = filterState.filter(function (filter) {
        return !!filter.get("parent_type") && (filter.get("id") > 0);
      });
      return _.map(typeFilters, function (filter) {
        return filter.toJSON();
      });
    },
    getNotSpecifiedTypeFilterKeys: function (filterState) {
      var typeFilters = filterState.filter(function (filter) {
        return !!filter.get("parent_type") && (filter.get("id") < 0);
      });
      return _.map(typeFilters, function (filter) {
        return {"id": -filter.get("id")};
      });
    }
  };

  return serialiser;
});