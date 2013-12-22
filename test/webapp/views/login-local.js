/*global describe, it, beforeEach, afterEach */
define(

  ["chai", "jquery", "backbone", "views/login_local"], 

  function (chai, $, Backbone, LoginLocal) {
    
    var should = chai.should();
    
    describe("interaction", function () {

      beforeEach(function () {
        this.targetEl = $("<div id='some-container'><div id='login-retred'></div></div>");
        this.targetEl.appendTo(document.body);

        this.loginLocal = new LoginLocal({
          el: "#some-container",
          user: new Backbone.Model({
            "logged-in": false
          })
        });
      });

      afterEach(function () {
        this.targetEl.remove();
      });

      it("should attach a popover the the login local button", function () {
        should.not.exist(this.loginLocal.$("#login-retred").data()["bs.popover"]);
        this.loginLocal.render();
        should.exist(this.loginLocal.$("#login-retred").data()["bs.popover"]);
      });

      describe("registration", function () {        

        it("should hide the popup after registration success", function () { 
          this.loginLocal.render();
          this.loginLocal.$("#login-retred").popover("show");
          this.loginLocal.$("#login-retred").data()["bs.popover"]
            .tip().hasClass("in").should.equal(true);
          this.loginLocal.handleRegisterSuccess();
          this.loginLocal.$("#login-retred").data()["bs.popover"]
            .tip().hasClass("in").should.equal(false);
        });

        it("should log the user in after registration success", function () {
          this.loginLocal.render();
          this.loginLocal.handleRegisterSuccess();
          this.loginLocal.user.get("logged-in").should.equal(true);
        });

        it("should show a message upon registration failure", function () {
          this.loginLocal.render();
          this.loginLocal.$("#login-retred").popover("show");
          this.loginLocal.$(".popover form .alert").text().should.equal("");
          this.loginLocal.handleRegisterFailure({});
          this.loginLocal.$(".popover form .alert").text()
            .should.equal(this.loginLocal.registrationFailedMessage);
        });

      });

      describe("logging in", function () {

        it("should hide the popup after login success", function () {
          this.loginLocal.render();
          this.loginLocal.$("#login-retred").popover("show");
          this.loginLocal.$("#login-retred").data()["bs.popover"]
            .tip().hasClass("in").should.equal(true);
          this.loginLocal.handleLoginSuccess();
          this.loginLocal.$("#login-retred").data()["bs.popover"]
            .tip().hasClass("in").should.equal(false);
        });

        it("should log the user in after login success", function () {
          this.loginLocal.render();
          this.loginLocal.handleLoginSuccess();
          this.loginLocal.user.get("logged-in").should.equal(true);
        });

        it("should show a message upon login failure", function () {
          this.loginLocal.render();
          this.loginLocal.$("#login-retred").popover("show");
          this.loginLocal.$(".popover form .alert").text().should.equal("");
          this.loginLocal.handleLoginFailure({});
          this.loginLocal.$(".popover form .alert").text()
            .should.equal(this.loginLocal.loginFailedMessage);
        });
        
      });

      it("should allow a user to cancel logging in by pressing the close button", function () {
        this.loginLocal.render();
        this.loginLocal.$("#login-retred").popover("show");
        this.loginLocal.$("#login-retred").data()["bs.popover"]
          .tip().hasClass("in").should.equal(true);
        this.loginLocal.handleClose();
        this.loginLocal.$("#login-retred").data()["bs.popover"]
          .tip().hasClass("in").should.equal(false);
      });
    });

  }

);