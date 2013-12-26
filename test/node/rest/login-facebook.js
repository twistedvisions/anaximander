/*global describe, it, beforeEach, afterEach */
var should = require("should");
var sinon = require("sinon");
var supertest = require("supertest");
var express = require("express");
var http = require("http");
var _ = require("underscore");
var passport = require("passport");
var io = require("socket.io-client");
var tryTest = require("../tryTest");
var LoginFacebook = require("../../../lib/rest/login-facebook");

describe("LoginFacebook", function () {
  describe("auth", function () {

    it("should send a response to the user with a login page and authAttempt id", function (done) {
      var app = express();
      var server = http.createServer(app);

      var lf = new LoginFacebook(app, server);

      supertest(app)
        .get("/auth/facebook")
        .expect("Content-Type", /json/)
        .expect(200)
        .end(function (err, res) {
          should.exist(res.body.location);
          should.exist(res.body.loginId);
          lf.shutdown();
          done();
        });
    });

    describe("reverse ajax", function () {
      beforeEach(function () {
        var port = 5000;
        
        var app = express();
        this.server = http.createServer(app);
        this.lf = new LoginFacebook(app, this.server);
        this.server.listen(port);
   
        var socketURL = "http://0.0.0.0:" + port;
        var options = {
          transports: ["websocket"],
          "force new connection": true
        };
        this.client = io.connect(socketURL, options);
      });
      afterEach(function () {

        this.server.close();
        this.lf.shutdown();
      });

      it("should allow the browser to create a websocket keyed by authAttempt id", function (done) {
        var loginId = "a7c5be80-68c4-11e3-961e-19bf02deeb36";

        var callRegister = tryTest(
          _.bind(function (/*data*/) {
            should.not.exist(this.lf.logins[loginId]);
            this.client.emit("register-login", {
              key: loginId
            });
            setTimeout(testValues, 10);
          }, this),
          function (ex) {
            if (ex) {
              done(ex);
            }
          }
        );

        var testValues = tryTest(
          _.bind(function (/*data*/) {
            should.exist(this.lf.logins[loginId]);
            should.exist(this.lf.logins[loginId].socket);
            should.exist(this.lf.logins[loginId].time);
          }, this),
          done
        );

        this.client.on("connect", callRegister);
      });

      it("should allow a browser to attempt to login multiple times", function (done) {

        var oldLoginId = "oldId";
        var newLoginId = "newId";

        this.lf.logins[oldLoginId] = {
          socket: {},
          time: 1
        };

        var callRegister = tryTest(
          _.bind(function (/*data*/) {
            this.client.emit("update-login", {
              "old": oldLoginId,
              "new": newLoginId
            });
            setTimeout(testValues, 10);
          }, this),
          function (ex) {
            if (ex) {
              done(ex);
            }
          }
        );

        var testValues = tryTest(
          _.bind(function () {
            should.not.exist(this.lf.logins[oldLoginId]);
            should.exist(this.lf.logins[newLoginId]);
            should.exist(this.lf.logins[newLoginId].socket);
            should.exist(this.lf.logins[newLoginId].time);
          }, this),
          done
        );

        this.client.on("connect", callRegister);
      });
    });

    describe("open connections", function () {
      
      var oneMinute = 60 * 1000;
      beforeEach(function () {
        this.clock = sinon.useFakeTimers();
        var app = express();
        var server = http.createServer(app);

        this.lf = new LoginFacebook(app, server);
      });

      afterEach(function () {
        this.lf.shutdown();
        this.clock.restore();
      });
      
      it("should remove open connections that have been unused for too long", function () {
        var disconnected = false;
        this.lf.logins[1] = {
          socket: {
            disconnect: function () {
              disconnected = true;
            }
          },
          time: new Date().getTime() - 11 * oneMinute
        };
        this.clock.tick(1.5 * oneMinute);
        _.keys(this.lf.logins).length.should.equal(0);
        disconnected.should.equal(true);
      });

      
      it("should leave open connections that are not too old", function () {
        this.lf.logins[1] = {
          socket: {
            disconnect: function () {}
          },
          time: new Date().getTime() - 9 * oneMinute
        };
        this.clock.tick(1.5 * oneMinute);
        _.keys(this.lf.logins).length.should.equal(1);
      });
    });

    describe("authorisation completion", function () {
      beforeEach(function () {
        this.app = express();
        this.app.use(express.cookieParser());
        this.app.use(passport.initialize());

        var server = http.createServer(this.app);

        this.loginId = "someid";
        this.lf = new LoginFacebook(this.app, server);

        sinon.stub(passport, "authenticate", function (strategy, f) {
          f(null, {id: 1});
        });

        this.req = supertest(this.app)
          .get("/auth/facebook/callback")
          .set("Cookie", ["login-id=" + this.loginId]);
      });

      afterEach(function () {
        this.lf.shutdown();
        passport.authenticate.restore();
      });

      it("should notify the browser when authorisation is complete", function (done) {
        var requestName, requestData;

        this.lf.logins[this.loginId] = {
          socket: {
            emit: function (_requestName, data) {
              requestName = _requestName;
              requestData = data;
            },
            disconnect: function () {}
          }
        };

        this.req
          .expect(200)
          .end(_.bind(function (/*err, res*/) {
            requestName.should.equal("complete");
            requestData.should.eql({id: 1});
            done();
          }, this));
      });

      it("should close the connection after authorisation is complete", function (done) {
        var disconnected = false;

        this.lf.logins[this.loginId] = {
          socket: {
            emit: function () {},
            disconnect: function () {
              disconnected = true;
            }
          }
        };
        
        this.req.expect(200)
          .end(_.bind(function (/*err, res*/) {
            disconnected.should.equal(true);
            should.not.exist(this.lf.logins[this.loginId]);
            done();
          }, this));
      });

      it("should redirect the open window to a page that closes itself", function (done) {
        var disconnected = false;

        this.lf.logins[this.loginId] = {
          socket: {
            emit: function () {},
            disconnect: function () {
              disconnected = true;
            }
          }
        };
        
        this.req.expect(200).end(tryTest(
          _.bind(function (err, res) {
            res.status.should.equal(302);
            res.header.location.should.equal("/fb_return.html");
          }, this),
          function (ex) {
            done(ex);
          }
        ));
      });
    });
  });
});