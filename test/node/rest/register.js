/*global describe, it, beforeEach, afterEach */

var stubDb = require("../stubDb");
var tryTest = require("../tryTest");

var _ = require("underscore");
var express = require("express");
var supertest = require("supertest");
var http = require("http");
var passport = require("passport");

var register = require("../../../lib/rest/register");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("register", function () {
  beforeEach(function () {
    stubDb.setup(this);

    this.app = express();
    this.app.use(express.bodyParser());

    this.app.use(passport.initialize());
    this.app.use(passport.session());

    register.init(this.app);

    this.server = http.createServer(this.app);
    this.server.listen(5000);

  });
  afterEach(function () {
    stubDb.restore(this);
    this.server.close();
  });

  it("creates an entry in the database with a bcrypt-ed password", function (done) {
    tryTest(_.bind(function () {
      supertest(this.app)
        .post("/register")
        .send({
          username: "some username",
          password: "some password"
        })
        .expect(200)
        .end(function (err, res) {
          tryTest(function () {
            JSON.parse(res.text).id.should.equal(1);
          }, done)();
        });
    }, this), done, true)();

    stubDb.setQueryValues(this, [
      [],  //get user
      [{id: 1}], //add user
      [{}], //add permissions
      [], //get user permissions
      []  //get group permissions
    ]);
  });

  it("creates add permissions", function (done) {
    this.a = 1;
    tryTest(_.bind(function () {
      supertest(this.app)
        .post("/register")
        .send({
          username: "some username",
          password: "some password"
        })
        .expect(200)
        .end(_.bind(function (/*err, res*/) {
          tryTest(_.bind(function () {
            this.args[2][1].should.equal("add_initial_user_permissions");
          }, this), done)();
        }, this));
    }, this), done, true)();

    stubDb.setQueryValues(this, [
      [],  //get user
      [{id: 1}], //add user
      [{}], //add permissions
      [], //get user permissions
      []  //get group permissions
    ]);
  });


  it("it should return permissions", function (done) {
    tryTest(_.bind(function () {
      supertest(this.app)
        .post("/register")
        .send({
          username: "some username",
          password: "some password"
        })
        .expect(200)
        .end(function (err, res) {
          tryTest(function () {
            _.pluck(JSON.parse(res.text).permissions, "id").should.eql([1, 2]);
          }, done)();
        });
    }, this), done, true)();

    stubDb.setQueryValues(this, [
      [],  //get user
      [{id: 1}], //add user
      [{}], //add permissions
      [{id: 1}], //get user permissions
      [{id: 2}]  //get group permissions
    ]);
  });


  it("should log the user in if it succeeds", function (done) {
    var loginCalled;
    var req = {
      body: {
        username: "some username",
        password: "some password"
      },
      logIn: function () {
        loginCalled = true;
      }
    };
    var res = {
      send: function () {
        tryTest(function () {
          loginCalled.should.equal(true);
        }, done)();
      }
    };

    register.handleRegister(req, res);

    stubDb.setQueryValues(this, [
      [],
      [{id: 1}],
      [{}],
      [],
      []
    ]);
  });

  it("doesn't create an entry if the user already exists", function (done) {
    tryTest(_.bind(function () {
      supertest(this.app)
        .post("/register")
        .send({
          username: "some username",
          password: "some password"
        })
        .end(function (err, res) {
          tryTest(function () {
            res.text.should.equal("user already exists");
          }, done)();
        });
    }, this), done, true)();

    stubDb.setQueryValues(this, [
      [{id: 1}]
    ]);
  });

  it("should send a 422 if the user already exists", function (done) {
    tryTest(_.bind(function () {
      supertest(this.app)
        .post("/register")
        .send({
          username: "some username",
          password: "some password"
        })
        .end(function (err, res) {
          tryTest(function () {
            res.statusCode.should.equal(422);
          }, done)();
        });
    }, this), done, true)();

    stubDb.setQueryValues(this, [
      [{id: 1}]
    ]);
  });

  it("doesn't create an entry if the username doesn't exist", function (done) {
    tryTest(_.bind(function () {
      supertest(this.app)
        .post("/register")
        .send({
          username: "",
          password: "some password"
        })
        .end(function (err, res) {
          tryTest(function () {
            res.status.should.equal(400);
            res.text.should.equal("a username must be given");
          }, done)();
        });
    }, this), done, true)();
  });

  it("doesn't create an entry if the password doesn't exist", function (done) {
    tryTest(_.bind(function () {
      supertest(this.app)
        .post("/register")
        .send({
          username: "some username",
          password: ""
        })
        .end(function (err, res) {
          tryTest(function () {
            res.status.should.equal(400);
            res.text.should.equal("a password must be given");
          }, done)();
        });
    }, this), done, true)();
  });
});