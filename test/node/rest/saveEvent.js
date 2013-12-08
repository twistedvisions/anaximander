/*global describe, it, beforeEach, afterEach */

var should = require("should");
var sinon = require("sinon");

var db = require("../../../lib/db");
var when = require("when");
var _ = require("underscore");

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
      var self = this;
      self.d = [];
      self.args = [];
      sinon.stub(db, "runQueryInTransaction", function () {
        var d = when.defer();
        self.d.push(d);
        self.args.push(arguments);
        return d.promise;
      });
    });
    afterEach(function () {
      db.runQueryInTransaction.restore();
    });

    describe("ensurePlace", function () {
      it("should try to find a place if it has an id", function (done) {
        var self = this;
        new saveEvent.EventSaver().ensurePlace({id: 3}).then(function () {
          var ex;
          try {
            self.args[0][0].indexOf("select").should.not.equal(-1);
          } catch (e) {
            ex = e;
          } finally {
            done(ex);
          }
        }, function (e) {
          done(e);
        });
        this.d[0].resolve({rows: [{id: 1}]});
      });

      it("throw an exception if it can't find a place", function (done) {
        new saveEvent.EventSaver().ensurePlace({id: 4}).then(function () {
          done({message: "should not succeed"});
        }, function (e) {
          var ex;
          try {
            should.exist(e);
          } catch (ee) {
            ex = ee;
          } finally {
            done(ex);
          }
        });
        this.d[0].resolve({rows: []});
      });

      it("should try to create a place if it doesn't exist", function (done) {
        var self = this;
        new saveEvent.EventSaver().ensurePlace({name: "somewhere"}).then(function () {
          var ex;
          try {
            self.args[0][0].indexOf("insert").should.not.equal(-1);
          } catch (e) {
            ex = e;
          } finally {
            done(ex);
          }
        }, function (e) {
          done(e);
        });
        this.d[0].resolve({rows: [{id: 1}]});
      });

      it("should return the place id if it was created", function (done) {
        new saveEvent.EventSaver().ensurePlace({name: "somewhere"}).then(function (id) {
          var ex;
          try {
            id.should.be.above(0);
          } catch (e) {
            ex = e;
          } finally {
            done(ex);
          }
        }, function (e) {
          done(e);
        });
        this.d[0].resolve({rows: [{id: 1}]});
      });
      it("should throw an exception if the place cannot be created", function (done) {
        new saveEvent.EventSaver().ensurePlace({name: "somewhere"}).then(function () {
          done({message: "should not succeed"});
        }, function (e) {
          var ex;
          try {
            should.exist(e);
          } catch (ee) {
            ex = ee;
          } finally {
            done(ex);
          }
        });
        this.d[0].resolve({rows: []});
      });
    });

    describe("ensureAttendees", function () {
      it("should ensure that each attendee exists", function (done) {
        var self = this;
        new saveEvent.EventSaver().ensureAttendees([{id: 3}, {id: 4}]).then(function () {
          var ex;
          try {
            self.args[0][0].indexOf("select").should.not.equal(-1);
            self.args[1][0].indexOf("select").should.not.equal(-1);
          } catch (e) {
            ex = e;
          } finally {
            done(ex);
          }
        }, function (e) {
          done(e);
        });
        this.d[0].resolve({rows: [{id: 3}]});
        this.d[1].resolve({rows: [{id: 4}]});
      });

      it("should throw an exception if an attendee cannot be found", function (done) {
        new saveEvent.EventSaver().ensureAttendees([{id: 3}, {id: 4}]).then(function () {
          done({message: "should not succeed"});
        }, function (e) {
          var ex;
          try {
            should.exist(e);
          } catch (ee) {
            ex = ee;
          } finally {
            done(ex);
          }
        });
        this.d[0].resolve({rows: [{id: 3}]});
        this.d[1].resolve({rows: []});
      });

      it("should create attendees if they do not exist", function (done) {
        var self = this;
        new saveEvent.EventSaver().ensureAttendees([{id: 3}, {id: -1, name: "someone"}]).then(function () {
          var ex;
          try {
            self.args[0][0].indexOf("select").should.not.equal(-1);
            self.args[1][0].indexOf("insert").should.not.equal(-1);
          } catch (e) {
            ex = e;
          } finally {
            done(ex);
          }
        }, function (e) {
          done(e);
        });
        this.d[0].resolve({rows: [{id: 3}]});
        this.d[1].resolve({rows: [{id: 4}]});
      });

      it("should callback with the new ids if they can be found", function (done) {
        new saveEvent.EventSaver().ensureAttendees([{id: 3}, {id: -1, name: "someone"}]).then(function (ids) {
          var ex;
          try {
            JSON.stringify(ids).should.equal(JSON.stringify([5, 6]));
          } catch (e) {
            ex = e;
          } finally {
            done(ex);
          } 

        }, function (e) {
          done(e);
        });
        this.d[0].resolve({rows: [{id: 5}]});
        this.d[1].resolve({rows: [{id: 6}]});
      });

      it("should throw an exception if an attendee cannot be created", function (done) {
        new saveEvent.EventSaver().ensureAttendees([{id: 3}, {id: -1, name: "someone"}]).then(function () {
          done({message: "should not succeed"});
        }, function (e) {
          var ex;
          try {
            should.exist(e);
          } catch (ee) {
            ex = ee;
          } finally {
            done(ex);
          }
        });
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
          function (id) {
            var ex;
            try {
              id.should.be.above(0);
            } catch (e) {
              ex = e;
            } finally {
              done(ex);
            } 
          }, function (e) {
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
            function (e) {
              var ex;
              try {
                should.exist(e);
              } catch (ee) {
                ex = ee;
              } finally {
                done(ex);
              }
            }
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
            function (e) {
              var ex;
              try {
                should.exist(e);
              } catch (ee) {
                ex = ee;
              } finally {
                done(ex);
              }
            }
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
          }, function (e) {
            var ex;
            try {
              should.exist(e);
            } catch (ee) {
              ex = ee;
            } finally {
              done(ex);
            }
          }
        );
        this.d[0].resolve({rows: []});
      });
    });

    describe("addAttendees", function () {
      it("should add each attendee to the event", function (done) {
        var self = this;
        new saveEvent.EventSaver().addAttendees([{id: 3}, {id: 4}], 5).then(
          function () {
            var ex;
            try {
              self.args[0][0].indexOf("insert").should.not.equal(-1);
              self.args[1][0].indexOf("insert").should.not.equal(-1);
            } catch (e) {
              ex = e;
            } finally {
              done(ex);
            } 
          }, function (e) {
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
      var transactionStub = function (result) {
        return function () {
          var d = when.defer();
          d.resolve(result);
          return d.promise;
        };
      };
      sinon.stub(db, "startTransaction", transactionStub({}));
      sinon.stub(db, "endTransaction", transactionStub());
      sinon.stub(db, "rollbackTransaction", transactionStub());
      sinon.stub(db, "runQueryInTransaction", function () {
        var d = when.defer();
        d.resolve({rows: [{id: 4}]});
        return d.promise;
      });
    });
    afterEach(function () {
      db.startTransaction.restore();
      db.endTransaction.restore();
      db.rollbackTransaction.restore();
      db.runQueryInTransaction.restore();
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
        }
      };
      var res = {
        send: function () {}
      };

      new saveEvent.EventSaver().saveEvent(req, res).then(function () {
        var ex;
        try {
          db.startTransaction.callCount.should.equal(1);
          db.endTransaction.callCount.should.equal(1);
        } catch (e) {
          ex = e;
        } finally {
          done(ex);
        }

      });
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
        }
      };
      var res = {
        send: function () {}
      };

      new saveEvent.EventSaver().saveEvent(req, res).then(
        function () {
          done({message: "shouldn't get here"});
        }, function () {
          var ex;
          try {
            db.startTransaction.callCount.should.equal(1);
            db.endTransaction.callCount.should.equal(0);
            db.rollbackTransaction.callCount.should.equal(1);
          } catch (e) {
            ex = e;
          } finally {
            done(ex);
          }
        }
      );
    });
  });
});