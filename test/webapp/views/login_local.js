/*global describe, it, beforeEach, afterEach, sinon */
define(

  ["chai", "jquery", "backbone", "views/login_local", "analytics"], 

  function (chai, $, Backbone, LoginLocal, Analytics) {
    
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

        sinon.stub(Analytics, "loginAttempted");
        sinon.stub(Analytics, "loginSucceeded");
        sinon.stub(Analytics, "loginFailed");
        sinon.stub(Analytics, "register");
      });

      afterEach(function () {
        this.targetEl.remove();

        Analytics.loginAttempted.restore();
        Analytics.loginSucceeded.restore();
        Analytics.loginFailed.restore();
        Analytics.register.restore();
      });

      it("should attach a popover the the login local button", function () {
        should.not.exist(this.loginLocal.$("#login-retred").data()["bs.popover"]);
        this.loginLocal.render();
        should.exist(this.loginLocal.$("#login-retred").data()["bs.popover"]);
      });

      it("should track clicks to the login local button", function () {
        this.loginLocal.handleLoginShown();
        Analytics.loginAttempted.calledOnce.should.equal(true);
        Analytics.loginAttempted.args[0][0].provider.should.equal("local");
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

        it("should track registration success", function () {
          this.loginLocal.render();
          this.loginLocal.handleRegisterSuccess();
          Analytics.register.calledOnce.should.equal(true);
          Analytics.register.args[0][0].provider.should.equal("local");
        });

        it("should show a message upon registration failure", function () {
          this.loginLocal.render();
          this.loginLocal.$("#login-retred").popover("show");
          this.loginLocal.$(".popover form .alert").text().should.equal("");
          this.loginLocal.handleRegisterFailure({});
          this.loginLocal.$(".popover form .alert").text()
            .should.equal(this.loginLocal.registrationFailedMessage);
        });

        it("should show a message if no username", function () {
          this.loginLocal.render();
          this.loginLocal.$("#login-retred").popover("show");
          this.loginLocal.$(".popover form input[name=username]").val("");
          this.loginLocal.$(".popover form input[name=password]").val("some password");
          this.loginLocal.$(".popover form .alert").text().should.equal("");
          this.loginLocal.handleRegister();
          this.loginLocal.$(".popover form .alert").text().should.equal(this.loginLocal.noUsernameMessage);
        });

        it("should show a message if no password", function () {
          this.loginLocal.render();
          this.loginLocal.$("#login-retred").popover("show");
          this.loginLocal.$(".popover form input[name=username]").val("some username");
          this.loginLocal.$(".popover form input[name=password]").val("");
          this.loginLocal.$(".popover form .alert").text().should.equal("");
          this.loginLocal.handleRegister();
          this.loginLocal.$(".popover form .alert").text().should.equal(this.loginLocal.noPasswordMessage);
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

        it("should track login success", function () {
          this.loginLocal.render();
          this.loginLocal.handleLoginSuccess();
          Analytics.loginSucceeded.calledOnce.should.equal(true);
          Analytics.loginSucceeded.args[0][0].provider.should.equal("local");
        });

        it("should track login failure", function () {
          this.loginLocal.render();
          this.loginLocal.handleLoginFailure({});
          Analytics.loginFailed.calledOnce.should.equal(true);
          Analytics.loginFailed.args[0][0].provider.should.equal("local");
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