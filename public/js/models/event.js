define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "deep-diff",
  "moment"
], function ($, _, Backbone, when, DeepDiff, moment) {
  var Event = Backbone.Model.extend({

    ignoredKeys: ["id", "last_edited", "reason"],

    parse: function (data) {

      data.start_date = moment(data.start_date);
      data.end_date = moment(data.end_date);

      data.start_date.add("minutes", this.getTimezoneOffset(data.start_date));
      data.end_date.add("minutes", this.getTimezoneOffset(data.end_date));

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
        url: "/event",
        type: "PUT",
        processData: false,
        contentType: "application/json",
        data: JSON.stringify(differences)
      }));
      return d;
    },

    getDifferences: function (values) {
      var oldValues = this.toJSON();

      var newParticipants = this.getParticipantDifference(oldValues.participants, values.participants);
      var oldParticipants = this.getParticipantDifference(values.participants, oldValues.participants);

      var originalParticipants = values.participants;

      oldValues.participants = this.removeParticipantsFromArray(oldValues.participants, oldParticipants);
      values.participants = this.removeParticipantsFromArray(values.participants, newParticipants);

      this.sortParticipants(oldValues);
      this.sortParticipants(values);

      var differences = this.getRawDifferences(oldValues, values);

      values.participants = originalParticipants;

      var toSend = {id: this.id};
      if (newParticipants.length > 0) {
        toSend.newParticipants = newParticipants;
      }
      if (oldParticipants.length > 0) {
        toSend.removedParticipants = _.map(_.keys(this.getParticipantArrayKeys(oldParticipants)), function (id) {
          return parseInt(id, 10);
        });
      }

      var editedParticipants = {};
      _.forEach(differences, function (difference) {
        if (difference.path[0] === "name") {
          toSend.name = difference.rhs;

        } else if (difference.path[0] === "placeId") {

          toSend.placeId = difference.rhs;

        } else if (difference.path[0] === "link") {

          toSend.link = difference.rhs;

        } else if (difference.path[0] === "start_date") {

          toSend.start_date = moment(difference.rhs);
          toSend.start_date.add("minutes", -this.getTimezoneOffset(toSend.start_date));
          toSend.start_date = toSend.start_date.toISOString();

        } else if (difference.path[0] === "end_date") {

          toSend.end_date = moment(difference.rhs);
          toSend.end_date.add("minutes", -this.getTimezoneOffset(toSend.end_date));
          toSend.end_date = toSend.end_date.toISOString();

        } else if (difference.path[0] === "type") {

          if (!toSend.type) {
            toSend.type = {};
          }
          if (difference.path[1] === "id") {
            toSend.type.id = difference.rhs;
          } else if (difference.path[1] === "name") {
            toSend.type.name = difference.rhs;
          }

        } else if ((difference.path[0] === "importance") && (difference.path[1] === "id")) {

          toSend.importance = _.extend({
            id: difference.rhs
          }, values.importance);

        } else if (difference.path[0] === "participants") {

          editedParticipants[difference.index] = editedParticipants[difference.index] || {};
          var editedParticipant = editedParticipants[difference.index];
          var path = difference.item.path;
          editedParticipant[path[0]] = editedParticipant[path[0]] || {};
          editedParticipant[path[0]][path[1]] = difference.item.rhs;

        }
      }, this);

      if (_.keys(editedParticipants).length > 0) {

        toSend.editedParticipants = _.map(editedParticipants, function (value, key) {
          var originalParticipant = oldValues.participants[key];
          var obj = {
            thing: {
              id: originalParticipant.thing.id
            }
          };
          _.forEach(value, function (value, key) {
            obj[key] = value;
          });

          if (!obj.type) {
            obj.type = originalParticipant.type;
          } else {
            obj.type.related_type_id = (values.type && values.type.id) || oldValues.type.id;
          }
          return obj;
        });
      }

      return toSend;
    },

    sortParticipants: function (values) {
      values.participants.sort(function (a, b) {
        if (a.thing.id && b.thing.id) {
          return a.thing.id > b.thing.id ? 1 : (a.thing.id === b.thing.id ? 0 : -1);
        } else if (a.thing.id) {
          return 1;
        } else if (b.thing.id) {
          return -1;
        }
        return a.thing.name > b.thing.name ? 1 : (a.thing.name === b.thing.name ? 0 : -1);
      });
    },

    //just so can be stubbed for testing
    getTimezoneOffset: function (moment) {
      return moment.zone();
    },

    getParticipantDifference: function (base, comparator) {
      var keys = this.getParticipantArrayKeys(base);
      var onlyInComparator = _.filter(comparator, function (participant) {
        var id = participant.thing.id;
        if (id === -1) {
          return true;
        }
        return !keys[id];
      });
      return onlyInComparator;
    },

    removeParticipantsFromArray: function (base, toRemove) {
      var keys = this.getParticipantArrayKeys(toRemove);
      var filteredParticipants = _.filter(base, function (participant) {
        return !keys[participant.thing.id];
      });
      return filteredParticipants;
    },

    getParticipantArrayKeys: function (participants) {
      return _.groupBy(participants, function (participant) {
        return participant.thing.id;
      });
    },

    getRawDifferences: function (oldValues, values) {
      var previous = _.omit(oldValues, ["location", "place",
        "start_offset_seconds", "end_offset_seconds", "last_edited"]);
      var current = _.omit(values, ["place"]);
      if (oldValues.place) {
        previous.placeId = oldValues.place.id;
      }
      if (values.place) {
        current.placeId = values.place.id;
      }
      previous.start_date = previous.start_date.toISOString();
      previous.end_date = previous.end_date.toISOString();
      current.start_date = current.start_date.toISOString();
      current.end_date = current.end_date.toISOString();

      var diff = DeepDiff.diff(previous, current);
      return diff;
    }

  });
  return Event;
});
