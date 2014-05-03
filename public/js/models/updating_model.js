define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "deep-diff",
  "underscore_string"
], function ($, _, Backbone, when, DeepDiff) {
  var UpdatingModel = {

    ignoredKeys: [],

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
        url: this.url(),
        type: "PUT",
        processData: false,
        contentType: "application/json",
        data: JSON.stringify(differences)
      }));
      return d;
    },

    getDifferences: function (values) {
      var oldValues = this.toJSON();

      var toSend = {id: this.id};

      var childDifferences = this.getChildObjectDifferences(this.childObjects, values, oldValues);

      // var originalChildValues = this.getOriginalChildValues(this.childObjects, values);

      this.removeChildObjectDifferencesFromCurrent(childDifferences, values, oldValues);

      var differences = this.getRawDifferences(oldValues, values);

      this.applyChildObjectDifferences(toSend, this.childObjects, childDifferences);

      // this.restoreChildObjectDifferences(toSend, childObjects, childDifferences);

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

    getChildObjectDifferences: function (childObjects, values, oldValues) {
      return _.map(this.childObjects, function (childObject) {
        var key = childObject.key;
        return {
          newChildObjects: this.diffFn(childObject, oldValues[key], values[key]),
          oldChildObjects: this.diffFn(childObject, values[key], oldValues[key])
        };
      }, this);
    },

    diffFn: function (childObject, base, comparator) {
      var keys = this.getChildObjectArrayKeys(childObject, base);
      var onlyInComparator = _.filter(comparator, function (obj) {
        var id = childObject.getPrimaryId(obj);
        if (id === -1) {
          return true;
        }
        return !keys[id];
      });
      return onlyInComparator;
    },

    applyChildObjectDifferences: function (toSend, childObjects, childDifferences) {
      _.each(_.zip(childObjects, childDifferences), function (item) {
        var childObject = item[0];
        var childDifference = item[1];

        if (childDifference.newChildObjects.length > 0) {
          var newKey = "new" + _.string.capitalize(childObject.key);
          toSend[newKey] = childDifference.newChildObjects;
        }
        if (childDifference.oldChildObjects.length > 0) {
          var removedKey = "removed" + _.string.capitalize(childObject.key);
          toSend[removedKey] = _.map(_.keys(this.getChildObjectArrayKeys(childDifference.oldChildObjects)), function (id) {
            //todo: should this be in getChildObjectArrayKeys all the time?
            return parseInt(id, 10);
          });
        }
      });
    },

    getOriginalChildValues: function (childObjects, values) {
      return _.map(this.childObjects, function (childObject) {
        return values[childObject.key];
      });
    },

    removeChildObjectDifferencesFromCurrent: function (childDifferences, values, oldValues) {
      _.each(this.childObjects, function (childObject) {
        var key = childObject.key;
        oldValues[key] = this.removeChildObjectsFromArray(childObject, oldValues[key], childDifferences.oldChildObjects);
        values[key] = this.removeChildObjectsFromArray(childObject, values[key], childDifferences.newChildObjects);
      }, this);
    },

    removeChildObjectsFromArray: function (childObject, base, toRemove) {
      var keys = this.getChildObjectArrayKeys(childObject, toRemove);
      var filteredObjects = _.filter(base, function (obj) {
        return !keys[childObject.getPrimaryId(obj)];
      });
      return filteredObjects;
    },

    getChildObjectArrayKeys: function (childObject, objects) {
      return _.groupBy(objects, function (obj) {
        return childObject.getPrimaryId(obj);
      });
    },

    rawKeysToIgnore: [],

    cleanRawObjects: function (/*oldValues, values, previous, current*/) {},

    getRawDifferences: function (oldValues, values) {
      var previous = _.omit(oldValues, this.rawKeysToIgnore);
      var current = _.omit(values, this.rawKeysToIgnore);

      this.cleanRawObjects(oldValues, values, previous, current);

      var diff = DeepDiff.diff(previous, current);
      return diff;
    }

  };
  return UpdatingModel;
});