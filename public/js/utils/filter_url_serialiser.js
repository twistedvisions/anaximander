define(["underscore", "underscore_string"], function (_) {

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
      var entries = _.map(filterMap, formatFilterMapEntry);
      entries.sort();
      return entries.join(";");
    },
    deserialise: function (string, model) {
      var filterTypes = string.split(";");
      var filters = [];
      _.forEach(filterTypes, function (filterType) {
        var values = filterType.split(":");

        var id = this.getTypeId(values[0]);
        var prefix = this.getPrefix(id);

        if (values[1] === "*") {
          filters.push({id: id});
        } else if (values[1]) {
          var filterSubTypes = values[1].split(",");
          _.forEach(filterSubTypes, function (filterSubType) {
            if (filterSubType === "u") {
              filters.push({id: this.getNonSpecifiedId(prefix, id), parent_type_id: id});
            } else {
              filters.push({id: this.getSubTypeId(prefix, filterSubType), parent_type_id: id});
            }
          }, this);
        }
      }, this);
      model.get("filterState").set(filters);
      return model;
    },
    getTypeId: function (id) {
      var typeId = parseInt(id, 10);
      if (typeId.toString() === id) {
        typeId = parseInt(id, 10);
      } else {
        typeId = id;
      }
      return typeId;
    },
    getPrefix: function (typeId) {
      var prefix;
      if (_.isString(typeId)) {
        prefix = typeId;
      } else {
        prefix = null;
      }
      return prefix;
    },
    getNonSpecifiedId: function (prefix, id) {
      if (prefix) {
        return prefix + ".ns";
      } else {
        return -id;
      }
    },
    getSubTypeId: function (prefix, id) {
      if (prefix) {
        return prefix + id;
      } else {
        return parseInt(id, 10);
      }
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
        var id = filter.id;
        if (_.string.endsWith(id, ".ns")) {
          id = id.substring(0, id.length - 3);
        }
        filterMap[id] = filterMap[id] || [];
        filterMap[id].push("u");
      });
      _.forEach(subTypes, function (filter) {
        filterMap[filter.parent_type_id] = filterMap[filter.parent_type_id] || [];
        filterMap[filter.parent_type_id].push(filter.id);
      });
      return filterMap;
    },
    getTypeFilterKeys: function (filterState, ignoreStringTypes) {
      var typeFilters = filterState.filter(function (filter) {
        return !filter.get("parent_type_id") && (!ignoreStringTypes || !_.isString(filter.id));
      });
      return _.map(typeFilters, function (filter) {
        return filter.toJSON();
      });
    },
    getSubtypeFilterKeys: function (filterState, ignoreStringTypes) {
      var typeFilters = filterState.filter(function (filter) {
        return !!filter.get("parent_type_id") &&
          ((filter.id > 0) ||
           (!ignoreStringTypes &&
            _.isString(filter.get("parent_type_id")) &&
            !_.string.endsWith(filter.id, ".ns")
           )
          );
      });
      return _.map(typeFilters, function (filter) {
        var json = filter.toJSON();
        if (_.isString(filter.get("parent_type_id"))) {
          json.id = parseInt(json.id.substring(filter.get("parent_type_id").length), 10);
        }
        return json;
      });
    },
    getNotSpecifiedTypeFilterKeys: function (filterState, ignoreStringTypes) {
      var typeFilters = filterState.filter(function (filter) {
        return !!filter.get("parent_type_id") &&
          ((filter.id < 0) ||
           (!ignoreStringTypes &&
            _.isString(filter.get("parent_type_id")) &&
            _.string.endsWith(filter.id, ".ns")
           )
          );
      });
      return _.map(typeFilters, function (filter) {
        return {"id": (_.isString(filter.id) ? filter.id : -filter.id)};
      });
    },
    getRoleFilterKeys: function (filterState) {
      return this._getStringEventTypeFilterKeys(filterState, "r");
    },
    getEventTypeFilterKeys: function (filterState) {
      return this._getStringEventTypeFilterKeys(filterState, "et");
    },
    _getStringEventTypeFilterKeys: function (filterState, key) {
      var typeFilters = filterState.filter(function (filter) {
        return filter.get("parent_type_id") === key;
      });
      return _.map(typeFilters, function (filter) {
        var json = filter.toJSON();
        json.id = parseInt(json.id.substring(filter.get("parent_type_id").length), 10);
        return json;
      });
    }
  };

  return serialiser;
});