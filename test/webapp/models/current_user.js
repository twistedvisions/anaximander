/*global sinon, describe, it, beforeEach, afterEach */
define(
  ["jquery", "models/current_user"], 
  function ($, CurrentUser) {
    describe("current user", function () {

      beforeEach(function () {
        sinon.stub($, "post");
      });
      afterEach(function () {
        $.post.restore();
      });

      it("should logout a logged in user", function () {
        new CurrentUser({
          "logged-in": true
        }).logout();
        $.post.calledWith("/logout").should.equal(true);
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