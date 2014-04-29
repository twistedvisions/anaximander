define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "deep-diff"
], function ($, _, Backbone, when, DeepDiff) {
  var Thing = Backbone.Model.extend({

    ignoredKeys: ["id", "last_edited", "reason"],

    parse: function (data) {
      data.typeId = data.type_id;
      delete data.type_id;
      return data;
    },

    hasDifferences: function (values) {
      var differences = this.getDifferences(values);
      return _.keys(_.omit(differences, this.ignoredKeys)).length > 0;
    },

    update: function (values, reason) {
      var differences = this.getDifferences(values);
      differences.reason = reason;
      if (_.keys(_.omit(differences, this.ignoredKeys)).length > 0) {
        differences.last_edited = this.get("last_edited");
        return this.sendChangeRequest(differences);
      } else {
        return when.reject();
      }
    },

    sendChangeRequest: function (differences) {
      //todo: the id should be in the url
      var d = when($.ajax({
        url: "/thing",
        type: "PUT",
        processData: false,
        contentType: "application/json",
        data: JSON.stringify(differences)
      }));
      return d;
    },

    getDifferences: function (values) {
      var oldValues = this.toJSON();

      var newSubtypes = this.getSubtypeDifference(oldValues.subtypes, values.subtypes);
      var oldSubtypes = this.getSubtypeDifference(values.subtypes, oldValues.subtypes);

      var originalSubtypes = values.subtypes;

      oldValues.subtypes = this.removeSubtypesFromArray(oldValues.subtypes, oldSubtypes);
      values.subtypes = this.removeSubtypesFromArray(values.subtypes, newSubtypes);

      var differences = this.getRawDifferences(oldValues, values);

      values.subtypes = originalSubtypes;

      var toSend = {id: this.id};
      if (newSubtypes.length > 0) {
        toSend.newSubtypes = newSubtypes;
      }
      if (oldSubtypes.length > 0) {
        toSend.removedSubtypes = _.map(_.keys(this.getSubtypeArrayKeys(oldSubtypes)), function (id) {
          return parseInt(id, 10);
        });
      }

      var editedSubtypes = {};
      _.forEach(differences, function (difference) {

        if (difference.path[0] === "name") {

          toSend.name = difference.rhs;

        } else if (difference.path[0] === "link") {

          toSend.link = difference.rhs;

        } else if (difference.path[0] === "typeId") {

          toSend.typeId = difference.rhs;

        } else if (
              (difference.path[0] === "subtypes") &&
              (difference.item.path[0] === "importance") &&
              (difference.item.path[1] === "id")
            ) {
          var typeId = oldValues.subtypes[difference.index].type.id;
          var importanceId = difference.item.rhs;
          if (importanceId === -1) {
            editedSubtypes[typeId] = values.subtypes[1].importance;
          } else {
            editedSubtypes[typeId] = {id: importanceId};
          }
        }

      }, this);

      if (_.keys(editedSubtypes).length > 0) {
        toSend.editedSubtypes = editedSubtypes;
      }

      return toSend;
    },

    getSubtypeDifference: function (base, comparator) {
      var keys = this.getSubtypeArrayKeys(base);
      var onlyInComparator = _.filter(comparator, function (subtype) {
        var id = subtype.type.id;
        if (id === -1) {
          return true;
        }
        return !keys[id];
      });
      return onlyInComparator;
    },

    removeSubtypesFromArray: function (base, toRemove) {
      var keys = this.getSubtypeArrayKeys(toRemove);
      var filteredSubtypes = _.filter(base, function (subtype) {
        return !keys[subtype.type.id];
      });
      return filteredSubtypes;
    },

    getSubtypeArrayKeys: function (subtypes) {
      return _.groupBy(subtypes, function (subtype) {
        return subtype.type.id;
      });
    },

    getRawDifferences: function (oldValues, values) {
      var previous = _.omit(oldValues, ["id", "last_edited"]);
      var current = _.omit(values, []);

      var diff = DeepDiff.diff(previous, current);
      return diff;
    }

  });
  return Thing;
});
