var _ = require("underscore");
var db = require("../db");
var pipeline = require("when/pipeline");
var TransactionRequest = require("./util/TransactionalRequest");
var EventUtils = require("./util/EventUtils");
var EventUpdateMixins = require("./util/EventUpdateMixins");

var EventDeleter = function () {};

_.extend(EventDeleter.prototype, TransactionRequest.prototype);
_.extend(EventDeleter.prototype, EventUtils.prototype);
_.extend(EventDeleter.prototype, EventUpdateMixins.prototype);

EventDeleter.prototype.validateRequest = function (req) {
  //todo: this should be in the url
  if (!req.body.id) {
    throw new Error("missing parameter 'id'");
  }

  if (_.keys(_.omit(req.body, ["id"])).length === 0) {
    throw new Error("no changes passed");
  }
};

EventDeleter.prototype.checkUserPermissions = function () {
  if (!this.permissions["delete-event"] && !this.permissions["delete-own-event"]) {
    throw new Error("User lacks 'delete-event' permission");
  }
};

EventDeleter.prototype.getCalls = function (req/*, res, next*/) {
  this.params = req.body;
  return [
    _.bind(this.lockEvent, this, this.params.id, this.params.last_edited),
    _.bind(this.getEvent, this, this.params.id),
    _.bind(this.validateEventPermission, this, this.params.id),

    //do changes:
    _.bind(this.deleteEvent, this, this.params),

    //commit
    _.bind(this.saveEventChanges, this, this.params.id),
    _.bind(this.updateEventLastEdited, this, this.params.id)
  ];
};

EventDeleter.prototype.validateEventPermission = function () {
  return (this.permissions["delete-event"]) ||
    (
      this.permissions["delete-own-event"] &&
      this.userId === this.originalEvent.creator_user_id
    );
};

EventDeleter.prototype.deleteEvent = function (params) {
  return pipeline([
    _.bind(function () {
      if (params.name) {
        return db.runQueryInTransaction(
          this.tx, "delete_event", [params.id]
        );
      }
    }, this)
  ]);
};

EventDeleter.prototype.setResponse = function () {
  this.responseData = {
    status: "ok"
  };
};

EventDeleter.prototype.saveEventChanges = function (eventId) {
  var newEvent = {reason: "user deleted event"};
  var oldEvent = {};
  return db.runQueryInTransaction(
    this.tx, "save_event_change",
    [this.userId, this.userIp, eventId,
      JSON.stringify(oldEvent), JSON.stringify(newEvent)]
  );
};

module.exports = {
  init: function (app) {
    //todo: id should be in url
    app.delete("/event", function () {
      var EventDeleter = new EventDeleter();
      EventDeleter.call.apply(EventDeleter, arguments);
    });
  },
  EventDeleter: EventDeleter
};
