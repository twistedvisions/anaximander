/*global sinon, describe, it, beforeEach, afterEach */
define(
  ["underscore", "chai", "anax_startup", "views/app", "models/current_user", "analytics"],
  function (_, chai, App, AppView, User, Analytics) {
    var should = chai.should();
    describe("anax", function () {
      it("should have a default view state", function () {
        should.exist(new App().model);
      });
      var useDelay;
      describe("initial model", function () {
        beforeEach(function () {
          var geolocation = {};
          this.result = {
            coords: {
              latitude: 1,
              longitude: -10
            }
          };
          this.clock = sinon.useFakeTimers();
          useDelay = true;
          geolocation.getCurrentPosition = _.bind(function (f) {
            if (useDelay) {
              setTimeout(_.bind(function () {
                f(this.result);
              }, this), 1);
            } else {
              f(this.result);
            }
          }, this);
          sinon.stub(App.prototype, "getGeolocationObject", function () {
            return geolocation;
          });
        });
        afterEach(function () {
          App.prototype.getGeolocationObject.restore();
          this.clock.restore();
        });
        describe("geolocation", function () {
          beforeEach(function () {
            sinon.stub(App.prototype, "getStoredData", function () { return {}; });
          });
          afterEach(function () {
            App.prototype.getStoredData.restore();
          });
          it("should get the location from geo data if it can at the start", function () {
            useDelay = false;
            var app = new App();
            app.model.get("center").should.eql([1, -10]);
          });
          it("should update the location from geo data if does not get it immediately", function () {
            useDelay = true;
            var app = new App();
            this.clock.tick(10);
            app.model.get("center").should.eql([1, -10]);
          });
          it("should not update the location from geo data if was set from the router", function () {
            useDelay = true;
            var app = new App();
            app.router = {initialisedByUrl: true};
            this.clock.tick(10);
            app.model.get("center").should.not.eql([1, -10]);
          });
        });
        describe("local storage", function () {
          it("should get the location from local storage if it exists", function () {
            useDelay = true;
            this.result = {};
            sinon.stub(App.prototype, "getLocalStorageState", function () {
              return JSON.stringify({
                "date": [1800, 1900],
                "center": [51, -4],
                "zoom": 9,
                "radius": 10,
                "filterState": [],
                "highlight": {},
                "query": null
              });
            });
            try {
              var app = new App();
              this.clock.tick(10);
              app.model.get("center").should.eql([51, -4]);
            } finally {
              App.prototype.getLocalStorageState.restore();
            }
          });
        });
      });

      it("should fetch a user model", function () {
        var app = new App();
        User.user = new User();
        sinon.stub(User.user, "fetch");
        app.start();
        User.user.fetch.calledOnce.should.equal(true);
        User.user.fetch.restore();
      });
      describe("handleUserFetchSuccess", function () {
        beforeEach(function () {
          sinon.stub(Analytics, "loginSucceeded");
          this.user = {
            get: _.bind(function (key) {
              if (key === "id") {
                return this.userId;
              }
            }, this),
            toJSON: sinon.stub()
          };
          this.app = new App();
          sinon.stub(this.app, "startRouter");
          sinon.stub(AppView.prototype, "render");
          sinon.stub(AppView.prototype, "fetchData");
        });
        afterEach(function () {
          Analytics.loginSucceeded.restore();
          AppView.prototype.fetchData.restore();
          AppView.prototype.render.restore();
        });
        it("should track if the user logged in on startup", function () {
          this.userId = 1;
          this.app.handleUserFetchSuccess(this.user);
          Analytics.loginSucceeded.calledOnce.should.equal(true);
        });
        it("should not track if the user did not log in on startup", function () {
          this.userId = -1;
          this.app.handleUserFetchSuccess(this.user);
          Analytics.loginSucceeded.calledOnce.should.equal(false);
        });
      });
    });
  }
);