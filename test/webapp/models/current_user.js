/*global sinon, describe, it, beforeEach, afterEach */
define(
  ["jquery", "models/current_user", "analytics"], 
  function ($, CurrentUser, Analytics) {
    describe("current user", function () {

      beforeEach(function () {
        sinon.stub($, "post", function (url, f) { f(); });
        sinon.stub(Analytics, "logout");
      });
      afterEach(function () {
        $.post.restore();
        Analytics.logout.restore();
      });

      it("should logout a logged in user", function () {
        new CurrentUser({
          "logged-in": true
        }).logout();
        $.post.calledWith("/logout").should.equal(true);
      });

      it("should send analytics", function () {
        new CurrentUser({
          "logged-in": true
        }).logout();
        Analytics.logout.calledOnce.should.equal(true);
      });

      it("should not logout user that is not logged in", function () {
        new CurrentUser({
          "logged-in": false
        }).logout();
        $.post.called.should.equal(false);
      });

    });
  }
);