/*global describe, it */
define(
  ["models/current_user"], 
  function (/*CurrentUser*/) {
    describe("current user", function () {
      it("should logout a logged in user");
      it("should not logout user that is not logged in");
    });
  }
);