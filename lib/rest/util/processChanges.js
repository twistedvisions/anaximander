var _ = require("underscore");
var when = require("when");
var pipeline = require("when/pipeline");
var db = require("../../db");

module.exports = {
  processChanges: function (changes) {
    var lookups = {
      typeId: {},
      importanceId: {}
    };
    try {
      lookups = _.reduce(changes, this.getChangeLookups, lookups);
      return this.getLookups(lookups)
        .then(_.bind(this.updateChanges, this, changes, lookups));
    } catch (e) {
      return when.reject(e);
    }
  },
  getChangeLookups: function (lookups, change) {
    var new_values = change.new_values;
    if (new_values.typeId) {
      lookups.typeId[new_values.typeId] = true;
    }
    if (new_values.importanceId) {
      lookups.importanceId[new_values.importanceId] = true;
    }
    return lookups;
  },
  getLookups: function (lookups) {
    return pipeline([
      _.bind(this.lookupTypes, this, lookups.typeId),
      _.bind(this.lookupImportances, this, lookups.importanceId, lookups.typeId)
    ]);
  },
  lookupTypes: function (typeIds) {
    return this.lookup(typeIds, "lookup_type_list");
  },
  lookupImportances: function (importanceIds) {
    return this.lookup(importanceIds, "lookup_importance_list");
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
      if (new_values.typeId) {
        new_values.type = lookups.typeId[new_values.typeId].name;
        delete new_values.typeId;
      }
      if (new_values.importanceId) {
        new_values.importance = lookups.importanceId[new_values.importanceId].name;
        delete new_values.importanceId;
      }
      return change;
    });
  }
};
