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
var OpenIdProvider = require("../../../lib/rest/login-openid");

var setupApp = function (provider, useClock) {
  if (useClock) {
    this.clock = sinon.useFakeTimers();
  }
  this.app = express();
  this.app.use(express.cookieParser());
  this.app.use(passport.initialize());
  this.server = http.createServer(this.app);

  this.Provider = new OpenIdProvider(this.app, this.server);
 
  this.lf = new this.Provider.provider(provider);
};

var teardownApp = function () {
  this.Provider.shutdown();
  if (this.clock) {
    this.clock.restore();
  }
};

_.each(["facebook", "google", "twitter", "github"], function (provider) {

  require("../../../lib/rest/auth/" + provider + "Strategy");
  
  describe("LoginOpenId via " + provider, function () {
    describe("auth", function () {
      describe("/auth/" + provider, function () {

        beforeEach(function () {
          _.bind(setupApp, this)(provider);
        });

        afterEach(function () {
          _.bind(teardownApp, this)();
        });

        it("should send a response to the user with a login page and authAttempt id", function (done) {
          
          supertest(this.app)
            .get("/auth/" + provider)
            .expect("Content-Type", /json/)
            .expect(200)
            .end(_.bind(function (err, res) {
              should.exist(res.body.location);
              should.exist(res.body.loginId);
              done();
            }, this));
        });
      });

      describe("reverse ajax", function () {
        beforeEach(function () {
          _.bind(setupApp, this)(provider);
          var port = 5000;
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
          _.bind(teardownApp, this)();
        });

        it("should allow the browser to create a websocket keyed by authAttempt id", function (done) {
          
          var loginId = "a7c5be80-68c4-11e3-961e-19bf02deeb36";

          var callRegister = tryTest(
            _.bind(function (/*data*/) {
              should.not.exist(this.Provider.logins[loginId]);

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
              should.exist(this.Provider.logins[loginId]);
              should.exist(this.Provider.logins[loginId].socket);
              should.exist(this.Provider.logins[loginId].time);
            }, this),
            done
          );

          this.client.on("connect", callRegister);

        });

        it("should allow a browser to attempt to login multiple times", function (done) {

          var oldLoginId = "oldId";
          var newLoginId = "newId";

          this.Provider.logins[oldLoginId] = {
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
              should.not.exist(this.Provider.logins[oldLoginId]);
              should.exist(this.Provider.logins[newLoginId]);
              should.exist(this.Provider.logins[newLoginId].socket);
              should.exist(this.Provider.logins[newLoginId].time);
            }, this),
            done
          );

          this.client.on("connect", callRegister);
        });
      });

      describe("open connections", function () {
        
        var oneMinute = 60 * 1000;

        beforeEach(function () {
          _.bind(setupApp, this)(provider, true);
        });

        afterEach(function () {
          _.bind(teardownApp, this)();
        });

        it("should remove open connections that have been unused for too long", function () {
          var disconnected = false;
          this.Provider.logins[1] = {
            socket: {
              disconnect: function () {
                disconnected = true;
              }
            },
            time: new Date().getTime() - 11 * oneMinute
          };
          this.clock.tick(1.5 * oneMinute);
          _.keys(this.Provider.logins).length.should.equal(0);
          disconnected.should.equal(true);
        });

        
        it("should leave open connections that are not too old", function () {
          this.Provider.logins[1] = {
            socket: {
              disconnect: function () {}
            },
            time: new Date().getTime() - 9 * oneMinute
          };
          this.clock.tick(1.5 * oneMinute);
          _.keys(this.Provider.logins).length.should.equal(1);
        });
      });

      describe("authorisation completion", function () {

        beforeEach(function () {
          _.bind(setupApp, this)(provider);
          this.loginId = "someid";

          sinon.stub(passport, "authenticate", function (strategy, f) {
            f(null, {id: 1});
          });

          this.req = supertest(this.app)
            .get("/auth/" + provider + "/callback")
            .set("Cookie", ["login-id=" + this.loginId]);
        });

        afterEach(function () {
          passport.authenticate.restore();
          _.bind(teardownApp, this)();
        });

        it("should notify the browser when authorisation is complete", function (done) {
          var requestName, requestData;

          this.Provider.logins[this.loginId] = {
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

          this.Provider.logins[this.loginId] = {
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
              should.not.exist(this.Provider.logins[this.loginId]);
              done();
            }, this));
        });

        it("should redirect the open window to a page that closes itself", function (done) {
          var disconnected = false;

          this.Provider.logins[this.loginId] = {
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
});