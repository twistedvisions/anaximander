/*global describe, it, beforeEach, afterEach */

var should = require("should");
var _ = require("underscore");

var tryTest = require("../tryTest");
var stubDb = require("../stubDb");

var saveEvent = require("../../../lib/rest/saveEvent");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("saveEvent", function () {
  describe("component functions", function () {

    beforeEach(function () {
      stubDb.setup(this);
    });
    afterEach(function () {
      stubDb.restore();
    });

    describe("permissions", function () {
      it("cannot be called if the user is not logged in");
    });

    describe("ensurePlace", function () {
      it("should try to find a place if it has an id", function (done) {
        var self = this;
        new saveEvent.EventSaver().ensurePlace({id: 3}).then(
          tryTest(function () {
            self.args[0][0].indexOf("select").should.not.equal(-1);
          }, done), 
          done
        );
        this.d[0].resolve({rows: [{id: 1}]});
      });

      it("throw an exception if it can't find a place", function (done) {
        new saveEvent.EventSaver().ensurePlace({id: 4}).then(
          function () {
            done({message: "should not succeed"});
          }, 
          tryTest(function (e) {
            should.exist(e);
          }, done)
        );
        this.d[0].resolve({rows: []});
      });

      it("should try to create a place if it doesn't exist", function (done) {
        var self = this;
        new saveEvent.EventSaver().ensurePlace({name: "somewhere"}).then(
          tryTest(function () {
            self.args[0][0].indexOf("insert").should.not.equal(-1);
          }, done
        ), done);
        this.d[0].resolve({rows: [{id: 1}]});
      });

      it("should return the place id if it was created", function (done) {
        new saveEvent.EventSaver().ensurePlace({name: "somewhere"}).then(
          tryTest(function (id) {
            id.should.be.above(0);
          }, done),
          done
        );
        this.d[0].resolve({rows: [{id: 1}]});
      });
      it("should throw an exception if the place cannot be created", function (done) {
        new saveEvent.EventSaver().ensurePlace({name: "somewhere"}).then(
          function () {
            done({message: "should not succeed"});
          }, 
          tryTest(function (e) {
            should.exist(e);
          }, done)
        );
        this.d[0].resolve({rows: []});
      });
    });

    describe("ensureAttendees", function () {
      it("should ensure that each attendee exists", function (done) {
        var self = this;
        new saveEvent.EventSaver().ensureAttendees([{id: 3}, {id: 4}]).then(
          tryTest(function () {
            self.args[0][0].indexOf("select").should.not.equal(-1);
            self.args[1][0].indexOf("select").should.not.equal(-1);
          }, done), 
          done
        );
        this.d[0].resolve({rows: [{id: 3}]});
        this.d[1].resolve({rows: [{id: 4}]});
      });

      it("should throw an exception if an attendee cannot be found", function (done) {
        new saveEvent.EventSaver().ensureAttendees([{id: 3}, {id: 4}]).then(
          function () {
            done({message: "should not succeed"});
          }, 
          tryTest(function (e) {
            should.exist(e);
          }, done)
        );
        this.d[0].resolve({rows: [{id: 3}]});
        this.d[1].resolve({rows: []});
      });

      it("should create attendees if they do not exist", function (done) {
        var self = this;
        new saveEvent.EventSaver().ensureAttendees([{id: 3}, {id: -1, name: "someone"}]).then(
          tryTest(function () {
            self.args[0][0].indexOf("select").should.not.equal(-1);
            self.args[1][0].indexOf("insert").should.not.equal(-1);
          }, done),
          done
        );
        this.d[0].resolve({rows: [{id: 3}]});
        this.d[1].resolve({rows: [{id: 4}]});
      });

      it("should callback with the new ids if they can be found", function (done) {
        new saveEvent.EventSaver().ensureAttendees([{id: 3}, {id: -1, name: "someone"}]).then(
          tryTest(function (ids) {
            JSON.stringify(ids).should.equal(JSON.stringify([5, 6]));
          }, done),
          done
        );
        this.d[0].resolve({rows: [{id: 5}]});
        this.d[1].resolve({rows: [{id: 6}]});
      });

      it("should throw an exception if an attendee cannot be created", function (done) {
        new saveEvent.EventSaver().ensureAttendees([{id: 3}, {id: -1, name: "someone"}]).then(
          function () {
            done({message: "should not succeed"});
          }, 
          tryTest(function (e) {
            should.exist(e);
          }, done)
        );
        this.d[0].resolve({rows: [{id: 5}]});
        this.d[1].resolve({rows: []});
      });
    });

    describe("createEvent", function () {
      it("should create event if all the necessary values exist", function (done) {
        new saveEvent.EventSaver().createEvent({
            name: "something happened",
            place_id: 1,
            start_date: "2013-06-02",
            end_date: "2013-06-02",
            link: "http://some.wiki.page/ihope.html"
          }
        ).then(
          tryTest(function (id) {
            id.should.be.above(0);
          }, done), 
          function (e) {
            done(e);
          }
        );
        this.d[0].resolve({rows: [{id: 5}]});
      });
      it("should handle quotes in the name", function (done) {
        new saveEvent.EventSaver().createEvent({
            name: "something happen's",
            place_id: 1,
            start_date: "2013-06-02",
            end_date: "2013-06-02",
            link: "http://some.wiki.page/ihope.html"
          }
        ).then(
          tryTest(_.bind(function (id) {
            id.should.be.above(0);
            this.args[0][0].indexOf("something happen''s").should.not.equal(-1);
          }, this), done), 
          function (e) {
            done(e);
          }
        );
        this.d[0].resolve({rows: [{id: 5}]});
      });
      ["name", "place_id", "start_date", "end_date", "link"].forEach(function (key) {
        it("should throw an exception if " + key + " cannot be found", function (done) {
          var obj = {
            name: "something happened",
            place_id: 1,
            start_date: "2013-06-02",
            end_date: "2013-06-02",
            link: "http://some.wiki.page/ihope.html"
          };
          delete obj[key];
          new saveEvent.EventSaver().createEvent(obj).then(
            function () {
              done({message: "should not succeed"});
            }, 
            tryTest(function (e) {
              should.exist(e);
            }, done)
          );
        });
      });
      it("should throw an exception if the end date is before the start date", function (done) {
          new saveEvent.EventSaver().createEvent({
            name: "something happened",
            place_id: 1,
            start_date: "2013-06-02",
            end_date: "2013-06-01",
            link: "http://some.wiki.page/ihope.html"
          }).then(
            function () {
              done({message: "should not succeed"});
            }, 
            tryTest(function (e) {
              should.exist(e);
            }, done)
          );
        });
      it("should throw an exception if it cannot create the event", function (done) {
        new saveEvent.EventSaver().createEvent({
            name: "something happened",
            place_id: 1,
            start_date: "2013-06-02",
            end_date: "2013-06-02",
            link: "http://some.wiki.page/ihope.html"
          }
        ).then(
          function () {
            done({message: "should not succeed"});
          }, 
          tryTest(function (e) {
            should.exist(e);
          }, done)
        );
        this.d[0].resolve({rows: []});
      });
    });

    describe("addAttendees", function () {
      it("should add each attendee to the event", function (done) {
        var self = this;
        new saveEvent.EventSaver().addAttendees([{id: 3}, {id: 4}], 5).then(
          tryTest(function () {
            self.args[0][0].indexOf("insert").should.not.equal(-1);
            self.args[1][0].indexOf("insert").should.not.equal(-1);
          }, done), 
          function (e) {
            done(e);
          }
        );
        _.defer(function () {
          self.d[0].resolve({rows: [{}]});
          self.d[1].resolve({rows: [{}]});
        });
      });
    });
  });

  describe("transaction", function () {
    beforeEach(function () {
      stubDb.setup(this);
    });
    afterEach(function () {
      stubDb.restore(this);
    });
    it("should do the entire save in a transaction", function (done) {
      
      var req = {
        body: {
          name: "a test",
          link: "http://testlink.com",
          start: "2013-03-12T00:00:00.000Z",
          end: "2013-03-12T00:00:00.000Z",
          place: {
            id: 58365, 
            name: "Sneem"
          },
          attendees: [{
            id: 611528,
            name: "Kareem Ajani (Person)"
          }]
        },
        isAuthenticated: function () {
          return true;
        }
      };
      var res = {
        send: function () {}
      };
      var next = function () {};

      new saveEvent.EventSaver().saveEvent(req, res, next).then(tryTest(
        _.bind(function () {
          this.db.startTransaction.callCount.should.equal(1);
          this.db.endTransaction.callCount.should.equal(1);
        }, this), done)); 
      stubDb.setQueryValues(this, [
        [{id: 1}],
        [{id: 2}],
        [{id: 3}],
        [{id: 4}]
      ]);
    });
    it("should roll back the transaction if a component section fails", function (done) {
      var req = {
        body: {
          name: "a test",
          start: "2013-03-12T00:00:00.000Z",
          end: "2013-03-12T00:00:00.000Z",
          place: {
            id: 58365, 
            name: "Sneem"
          },
          attendees: [{
            id: -1
          }]
        },
        isAuthenticated: function () {
          return true;
        }
      };
      var res = {
        send: function () {}
      };

      new saveEvent.EventSaver().saveEvent(req, res).then(
        function () {
          done({message: "shouldn't get here"});
        }, 
        tryTest(_.bind(function () {
          this.db.startTransaction.callCount.should.equal(1);
          this.db.endTransaction.callCount.should.equal(0);
          this.db.rollbackTransaction.callCount.should.equal(1);
        }, this), done) 
      );

      stubDb.setQueryValues(this, [
        [{id: 1}],
        [{id: 2}],
        [{id: 3}],
        [{id: 4}]
      ]);

    });
  });

  describe("user state", function () {
    it("shouldn't save an event if the user is not logged in");
  });
});