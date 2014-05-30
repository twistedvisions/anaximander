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

    this.getTopLevelLookups(lookups, new_values);

    this.getParticipantCreationLookups(lookups, new_values.participants);
    this.getParticipantChangeLookups(lookups, new_values.newParticipants);
    this.getParticipantChangeLookups(lookups, new_values.editedParticipants);
    this.getRemovedParticipantLookups(lookups, new_values.removedParticipants);

    this.getSubtypeCreationLookups(lookups, new_values.subtypes);
    this.getNewSubtypeLookups(lookups, new_values.newSubtypes);
    this.getEditedSubtypeLookups(lookups, new_values.editedSubtypes);
    this.getRemovedSubtypeLookups(lookups, new_values.removedSubtypes);
    this.getTypeDefaultImportanceLookups(lookups, new_values.defaultImportanceId);

    return lookups;
  },

  getTopLevelLookups: function (lookups, values) {
    if (values.type_id) {
      lookups.typeId[values.type_id] = true;
    }
    if (values.parent_type_id) {
      lookups.typeId[values.parent_type_id] = true;
    }
    if (values.importance_id) {
      lookups.importanceId[values.importance_id] = true;
    }
    if (values.default_importance_id) {
      lookups.importanceId[values.default_importance_id] = true;
    }
    if (values.place_id) {
      lookups.placeId[values.place_id] = true;
    }
  },

  getParticipantCreationLookups: function (lookups, participants) {
    if (participants) {
      _.each(participants, function (participant) {
        lookups.typeId[participant.role_id] = true;
        lookups.importanceId[participant.importance_id] = true;
        lookups.thingId[participant.thing_id] = true;
      });
    }
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

  getSubtypeCreationLookups: function (lookups, subtypes) {
    if (subtypes) {
      _.each(subtypes, function (subtype) {
        lookups.typeId[subtype.type_id] = true;
        lookups.importanceId[subtype.importance_id] = true;
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

  getTypeDefaultImportanceLookups: function (lookups, defaultImportanceId) {
    if (defaultImportanceId) {
      lookups.importanceId[defaultImportanceId] = true;
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

      this.applyTopLevelChanges(lookups, new_values);

      this.updateParticipantCreation(lookups, new_values.participants);
      this.updateParticipantChanges(lookups, new_values.newParticipants);
      this.updateParticipantChanges(lookups, new_values.editedParticipants);
      this.updateRemovedParticipants(lookups, new_values);

      this.updateCreatedSubtypes(lookups, new_values.subtypes);
      this.updateNewSubtypes(lookups, new_values.newSubtypes);
      this.updateEditedSubtypes(lookups, new_values);
      this.updateRemovedSubtypes(lookups, new_values);

      this.updateTypeDefaultImportances(lookups, new_values);

      return change;
    }, this);
  },

  applyTopLevelChanges: function (lookups, values) {
    if (values.type_id) {
      values.type = lookups.typeId[values.type_id].name;
      delete values.type_id;
    }
    if (values.parent_type_id) {
      values.parent_type = lookups.typeId[values.parent_type_id].name;
      delete values.parent_type_id;
    }
    if (values.importance_id) {
      values.importance = lookups.importanceId[values.importance_id].name;
      delete values.importance_id;
    }
    if (values.default_importance_id) {
      values.default_importance = lookups.importanceId[values.default_importance_id].name;
      delete values.default_importance_id;
    }
    if (values.place_id) {
      values.place = lookups.placeId[values.place_id].name;
      delete values.place_id;
    }
    if (values.creator_id) {
      delete values.creator_id;
    }
  },

  updateParticipantCreation: function (lookups, participants) {
    if (participants) {
      _.each(participants, function (participant) {
        participant.type = lookups.typeId[participant.role_id].name;
        participant.importance = lookups.importanceId[participant.importance_id].name;
        participant.thing = lookups.thingId[participant.thing_id].name;

        delete participant.role_id;
        delete participant.importance_id;
        delete participant.thing_id;
      });
    }
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

  updateCreatedSubtypes: function (lookups, subtypes) {
    if (subtypes) {
      _.each(subtypes, function (subtype) {
        subtype.type = lookups.typeId[subtype.type_id].name;
        subtype.importance = lookups.importanceId[subtype.importance_id].name;
        delete subtype.type_id;
        delete subtype.importance_id;
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
  },

  updateTypeDefaultImportances: function (lookups, new_values) {
    if (new_values.defaultImportanceId) {
      new_values.defaultImportance = lookups.importanceId[new_values.defaultImportanceId].name;
      delete new_values.defaultImportanceId;
    }
  }

};
