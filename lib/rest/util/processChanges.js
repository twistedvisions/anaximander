var _ = require("underscore");
var when = require("when");
var pipeline = require("when/pipeline");
var db = require("../../db");

module.exports = {
  keys: ["type", "importance", "place"],
  processChanges: function (changes) {
    var lookups = {};
    this.keys.forEach(function (key) {
      lookups[key + "Id"] = [];
    });
    try {
      lookups = _.reduce(changes, _.bind(this.getChangeLookups, this), lookups);
      return this.getLookups(lookups)
        .then(_.bind(this.updateChanges, this, changes, lookups));
    } catch (e) {
      return when.reject(e);
    }
  },
  getChangeLookups: function (lookups, change) {
    var new_values = change.new_values;
    this.keys.forEach(function (key) {
      if (new_values[key + "Id"]) {
        lookups[key + "Id"][new_values[key + "Id"]] = true;
      }
    });
    return lookups;
  },
  getLookups: function (lookups) {
    var calls = _.map(this.keys, function (key) {
      return _.bind(this.lookup, this,
        lookups[key + "Id"], "lookup_" + key + "_list");
    }, this);
    return pipeline(calls);
  },
  lookupTypes: function (typeIds) {
    return this.lookup(typeIds, "lookup_type_list");
  },
  lookupImportances: function (importanceIds) {
    return this.lookup(importanceIds, "lookup_importance_list");
  },
  lookupPlaces: function (placeIds) {
    return this.lookup(placeIds, "lookup_place_list");
  },
  lookup: function (_ids, query) {
    var ids = _.map(_.keys(_ids), function (x) {
      return parseInt(x, 10);
    });
    if (ids.length > 0) {
      return db.runQuery(query, [ids]).then(function (result) {
        _.each(result.rows, function (row) {
          _ids[row.id] = row;
        });
      }, function () {
      });
    } else {
      return when.resolve();
    }
  },
  updateChanges: function (changes, lookups) {
    return _.map(changes, function (change) {
      var new_values = change.new_values;
      this.keys.forEach(function (key) {
        if (new_values[key + "Id"]) {
          new_values[key] = lookups[key + "Id"][new_values[key + "Id"]].name;
          delete new_values[key + "Id"];
        }
      });
      return change;
    }, this);
  }
};
