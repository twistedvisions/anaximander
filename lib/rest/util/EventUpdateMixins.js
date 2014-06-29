var _ = require("underscore");
var when = require("when");

var db = require("../../db");

var getEvent = require("./GetEvent");

var EventUpdateMixins = function () {};

EventUpdateMixins.prototype.lockEvent = function (id, reqLastEdited) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "get_event_lock", [id]
  ).then(
    function (result) {
      if (result.rows.length === 1) {
        var currentLastEdited = result.rows[0].last_edited;
        if (new Date(currentLastEdited).getTime() !== new Date(reqLastEdited).getTime()) {
          d.reject(new Error("lockEvent failed - last_edited times do not match - " +
            currentLastEdited + " vs " + reqLastEdited));
        } else {
          d.resolve();
        }
      } else {
        d.reject(new Error(
          "lockEvent expected 1 row, but received: " + result.rows.length
        ));
      }
    },
    d.reject
  );
  return d.promise;
};

EventUpdateMixins.prototype.getEvent = function (id) {
  var d = when.defer();
  getEvent(id, true).then(
    _.bind(function (event) {
      this.originalEvent = event;
      d.resolve();
    }, this),
    d.reject
  );
  return d.promise;
};

EventUpdateMixins.prototype.updateEventLastEdited = function (eventId) {
  return db.runQueryInTransaction(
    this.tx, "update_event_last_edited",
    [eventId]
  );
};

module.exports = EventUpdateMixins;
