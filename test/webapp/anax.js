/*global sinon, describe, it, beforeEach, afterEach */
define(
  ["underscore", "chai", "anax_startup", "views/app", "analytics"],
  function (_, chai, App, AppView, Analytics) {
    var should = chai.should();
    describe("anax", function () {
      it("should have a default view state", function () {
        should.exist(new App().model);
      });
      it("should fetch a user model to AppView", function () {
        var app = new App();
        sinon.stub(app.user, "fetch");
        app.start();
        app.user.fetch.calledOnce.should.equal(true);
        app.user.fetch.restore();
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
          sinon.stub(AppView.prototype, "fetchData");
        });
        afterEach(function () {
          Analytics.loginSucceeded.restore();
          AppView.prototype.fetchData.restore();
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