/*global describe, it, beforeEach, afterEach */

var sinon = require("sinon");
var should = require("should");
var _ = require("underscore");

var tryTest = require("../../tryTest");
var stubDb = require("../../stubDb");

var EventUtils = require("../../../../lib/rest/util/EventUtils");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("EventUtils", function () {

  beforeEach(function () {
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore(this);
  });

  describe("addAttendees", function () {
    it("should add each attendee to the event", function (done) {
      var self = this;
      new EventUtils().addParticipants(1, [
          {thing: {id: 3}, type: {id: 4}, importance: {id: 5}},
          {thing: {id: 6}, type: {id: 7}, importance: {id: 8}}
        ], 9).then(
        tryTest(function () {
          self.args[1][1].should.equal("save_event_participant");
          self.args[2][1].should.equal("save_event_participant");
        }, done),
        function (e) {
          done(e);
        }
      );
      stubDb.setQueryValues(this, [
        [{id: 1}],
        [{id: 2}],
        [{id: 3}]
      ]);
    });
    it("should add a creator if necessary", function (done) {
      var self = this;
      new EventUtils().addParticipants(1, [
          {thing: {id: 3}, type: {id: 4}, importance: {id: 5}},
          {thing: {id: 6}, type: {id: 7}, importance: {id: 8}}
        ], 9).then(
        tryTest(function () {
          self.args[0][1].should.equal("save_creator");
        }, done),
        function (e) {
          done(e);
        }
      );
      stubDb.setQueryValues(this, [
        [{id: 1}],
        [{id: 2}],
        [{id: 3}]
      ]);
    });
  });

  describe("ensureParticipant", function () {
    beforeEach(function () {
      this.eventUtils = new EventUtils();
      sinon.stub(this.eventUtils, "ensure");
    });
    describe("new participants", function () {
      it("should throw an exception if it isn't passed a thing", function () {
        var ex;
        try {
          this.eventUtils.ensureParticipant({
            type: {id: 1},
            importance: {id: 2}
          });
        }
        catch (e) {
          ex = e;
        }
        should.exist(ex);
      });
      it("should throw an exception if it isn't passed a type", function () {
        var ex;
        try {
          this.eventUtils.ensureParticipant({
            thing: {id: 1},
            importance: {id: 2}
          });
        }
        catch (e) {
          ex = e;
        }
        should.exist(ex);
      });

      it("should throw an exception if it isn't passed a importance", function () {
        var ex;
        try {
          this.eventUtils.ensureParticipant({
            type: {id: 1},
            thing: {id: 2}
          });
        }
        catch (e) {
          ex = e;
        }
        should.exist(ex);
      });
      it("should ensure participants roles", function (done) {
        this.eventUtils.ensureParticipant({
          thing: {id: 1},
          type: {id: 2},
          importance: {id: 3}
        }).then(
          tryTest(_.bind(function () {
            this.eventUtils.ensure.calledWith(sinon.match.any, "participant type").should.equal(true);
            this.eventUtils.ensure.args[0][6].should.eql(["add-type"]);
          }, this), done)
        );
        stubDb.setQueryValues(this, [[]]);
      });
      it("should ensure participants importances", function (done) {
        this.eventUtils.ensureParticipant({
          thing: {id: 1},
          type: {id: 2},
          importance: {id: 3}
        }).then(
          tryTest(_.bind(function () {
            this.eventUtils.ensure.calledWith(sinon.match.any, "participant importance").should.equal(true);
            this.eventUtils.ensure.args[1][6].should.eql(["add-importance"]);
          }, this), done)
        );
        stubDb.setQueryValues(this, [[]]);
      });
      it("should save a default importance if it is a new type", function (done) {
        this.eventUtils.ensureParticipant({
          thing: {id: 1},
          type: {id: -1},
          importance: {id: -1}
        }).then(
          tryTest(_.bind(function () {
            this.args[0][1].should.equal("update_type_default_importance_when_null");
          }, this), done)
        );
        stubDb.setQueryValues(this, [[]]);
      });
      describe("existing things", function () {
        it("should ensure participant things", function (done) {
          this.eventUtils.ensureParticipant({
            thing: {id: 1},
            type: {id: 2},
            importance: {id: 3}
          }).then(
            tryTest(_.bind(function () {
              this.eventUtils.ensure.calledWith(sinon.match.any, "participant thing").should.equal(true);
            }, this), done)
          );
          stubDb.setQueryValues(this, [[]]);
        });
      });
      describe("new things", function () {
        beforeEach(function () {
          this.participant = {
            thing: {
              id: -1,
              name: "new thing",
              typeId: 1,
              subtypes: [
                {
                  type: {id: 4},
                  importance: {id: 5}
                }
              ]
            },
            type: {id: 2},
            importance: {id: 3}
          };
        });
        it("should ensure subtypes type", function (done) {
          this.eventUtils.ensureParticipant(this.participant).then(
            tryTest(_.bind(function () {
              this.eventUtils.ensure.calledWith(sinon.match.any, "participant thing subtype type").should.equal(true);
              this.eventUtils.ensure.args[2][6].should.eql(["add-type"]);
            }, this), done)
          );
          stubDb.setQueryValues(this, [[]]);
        });
        it("should ensure subtypes importance", function (done) {
          this.eventUtils.ensureParticipant(this.participant).then(
            tryTest(_.bind(function () {
              this.eventUtils.ensure.calledWith(sinon.match.any, "participant thing subtype importance").should.equal(true);
              this.eventUtils.ensure.args[3][6].should.eql(["add-importance"]);
            }, this), done)
          );
          stubDb.setQueryValues(this, [[]]);
        });
        it("should add a save a default importance when the type is new", function (done) {
          this.participant = {
            thing: {
              id: -1,
              name: "new thing",
              typeId: 1,
              subtypes: [
                {
                  type: {id: -1},
                  importance: {id: -1}
                }
              ]
            },
            type: {id: 2},
            importance: {id: 3}
          };
          this.eventUtils.ensureParticipant(this.participant).then(
            tryTest(_.bind(function () {
              this.args[0][1].should.equal("update_type_default_importance_when_null");
            }, this), done)
          );
          stubDb.setQueryValues(this, [[], []]);
        });
        it("should create new participants things", function (done) {
          this.eventUtils.ensureParticipant(this.participant).then(
            tryTest(_.bind(function () {
              this.eventUtils.ensure.calledWith(sinon.match.any, "participant thing").should.equal(true);
              this.eventUtils.ensure.args[4][6].should.eql(["add-thing"]);
            }, this), done)
          );
          stubDb.setQueryValues(this, [[]]);
        });
        it("should add subtypes to the new thing", function (done) {
          this.eventUtils.ensureParticipant(this.participant).then(
            tryTest(_.bind(function () {
              this.args[0][1].should.equal("save_thing_subtype");
            }, this), done)
          );
          stubDb.setQueryValues(this, [[]]);
        });
      });
    });
    describe("changing participants", function () {
      it("should ensure at least one of types and importances exist", function () {
        var ex;
        try {
          this.eventUtils.ensureParticipant({
            thing: {id: 1},
            type: {id: 2}
          }, true);
        }
        catch (e) {
          ex = e;
        }
        should.not.exist(ex);

        try {
          this.eventUtils.ensureParticipant({
            thing: {id: 1}
          }, true);
        }
        catch (e) {
          ex = e;
        }
        should.exist(ex);
      });
      it("should ensure that the thing exists in the event", function (done) {
        this.eventUtils.ensureParticipant({
          thing: {id: 1},
          type: {id: 2},
          importance: {id: 3}
        }, true).then(
          tryTest(_.bind(function () {
            this.eventUtils.ensure.calledWith(sinon.match.any, "participant thing").should.equal(true);
          }, this), done)
        );
        stubDb.setQueryValues(this, [[]]);
      });
      it("should ensure participants roles", function (done) {
        this.eventUtils.ensureParticipant({
          thing: {id: 1},
          type: {id: 2},
          importance: {id: 3}
        }, true).then(
          tryTest(_.bind(function () {
            this.eventUtils.ensure.calledWith(sinon.match.any, "participant type").should.equal(true);
          }, this), done)
        );
        stubDb.setQueryValues(this, [[]]);
      });
      it("should ensure participants importances", function (done) {
        this.eventUtils.ensureParticipant({
          thing: {id: 1},
          type: {id: 2},
          importance: {id: 3}
        }, true).then(
          tryTest(_.bind(function () {
            this.eventUtils.ensure.calledWith(sinon.match.any, "participant importance").should.equal(true);
          }, this), done)
        );
        stubDb.setQueryValues(this, [[]]);
      });
    });
  });
});
