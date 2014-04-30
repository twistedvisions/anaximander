var _ = require("underscore");
var when = require("when");
var pipeline = require("when/pipeline");
var db = require("../../db");

module.exports = {

  keys: ["type", "importance", "place", "thing"],

  processChanges: function (changes) {
    var lookups = {};
    this.keys.forEach(function (key) {
      lookups[key + "Id"] = {};
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
    this.getParticipantChangeLookups(lookups, new_values.newParticipants);
    this.getParticipantChangeLookups(lookups, new_values.editedParticipants);
    this.getRemovedParticipantLookups(lookups, new_values.removedParticipants);
    this.getNewSubtypeLookups(lookups, new_values.newSubtypes);
    this.getEditedSubtypeLookups(lookups, new_values.editedSubtypes);
    this.getRemovedSubtypeLookups(lookups, new_values.removedSubtypes);
    return lookups;
  },

  getParticipantChangeLookups: function (lookups, participants) {
    if (participants) {
      _.each(participants, function (participant) {
        lookups.typeId[participant.type.id] = true;
        lookups.importanceId[participant.importance.id] = true;
        lookups.thingId[participant.thing.id] = true;
      });
    }
  },

  getRemovedParticipantLookups: function (lookups, removedParticipantIds) {
    if (removedParticipantIds) {
      _.each(removedParticipantIds, function (participantId) {
        lookups.thingId[participantId] = true;
      });
    }
  },

  getNewSubtypeLookups: function (lookups, subtypes) {
    if (subtypes) {
      _.each(subtypes, function (subtype) {
        lookups.typeId[subtype.type.id] = true;
        lookups.importanceId[subtype.importance.id] = true;
      });
    }
  },

  getEditedSubtypeLookups: function (lookups, subtypes) {
    if (subtypes) {
      _.each(subtypes, function (importance, subtypeId) {
        lookups.typeId[subtypeId] = true;
        lookups.importanceId[importance.id] = true;
      });
    }
  },

  getRemovedSubtypeLookups: function (lookups, removedSubtypeIds) {
    if (removedSubtypeIds) {
      _.each(removedSubtypeIds, function (subtypeId) {
        lookups.typeId[subtypeId] = true;
      });
    }
  },

  getLookups: function (lookups) {
    var calls = _.map(this.keys, function (key) {
      return _.bind(this.lookup, this,
        lookups[key + "Id"], "lookup_" + key + "_list");
    }, this);
    return pipeline(calls);
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
      this.updateParticipantChanges(lookups, new_values.newParticipants);
      this.updateParticipantChanges(lookups, new_values.editedParticipants);
      this.updateRemovedParticipants(lookups, new_values);


      this.updateNewSubtypes(lookups, new_values.newSubtypes);
      this.updateEditedSubtypes(lookups, new_values);
      this.updateRemovedSubtypes(lookups, new_values);
      return change;
    }, this);
  },

  updateParticipantChanges: function (lookups, participants) {
    if (participants) {
      _.each(participants, function (participant) {
        participant.type = lookups.typeId[participant.type.id].name;
        participant.importance = lookups.importanceId[participant.importance.id].name;
        participant.thing = lookups.thingId[participant.thing.id].name;
      });
    }
  },

  updateRemovedParticipants: function (lookups, new_values) {
    if (new_values.removedParticipants) {
      new_values.removedParticipants = _.map(new_values.removedParticipants, function (participant) {
        return lookups.thingId[participant].name;
      });
    }
  },

  updateNewSubtypes: function (lookups, subtypes) {
    if (subtypes) {
      _.each(subtypes, function (subtype) {
        subtype.type = lookups.typeId[subtype.type.id].name;
        subtype.importance = lookups.importanceId[subtype.importance.id].name;
      });
    }
  },

  updateEditedSubtypes: function (lookups, new_values) {
    if (new_values.editedSubtypes) {
      new_values.editedSubtypes = _.map(new_values.editedSubtypes, function (importance, subtypeId) {
        return {
          type: lookups.typeId[subtypeId].name,
          importance: lookups.importanceId[importance.id].name
        };
      });
    }
  },

  updateRemovedSubtypes: function (lookups, new_values) {
    if (new_values.removedSubtypes) {
      new_values.removedSubtypes = _.map(new_values.removedSubtypes, function (subtype) {
        return lookups.typeId[subtype].name;
      });
    }
  }

};
