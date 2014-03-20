/*global describe, it */
var getEvent = require("../../../lib/rest/getEvent");

describe("getEvent", function () {

  describe("handleGetEvent", function () {
    it("should group results into participants", function () {
      var event;
      var req = {
        send: function (_event) {
          event = _event;
        }
      };
      var next = function () {};
      getEvent.handleGetEvent(req, next, {rows: [{}, {}]});
      event.participants.length.should.equal(2);
    });
    it("should group keys prefixed with participant", function () {
      var event;
      var req = {
        send: function (_event) {
          event = _event;
        }
      };
      var next = function () {};
      getEvent.handleGetEvent(req, next, {rows:
        [{
          participant_id: 1
        },
        {
          participant_id: 2
        }]
      });
      event.participants[0].id.should.equal(1);
      event.participants[1].id.should.equal(2);
    });
  });
});