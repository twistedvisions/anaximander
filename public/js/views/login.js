define([
  "jquery",
  "underscore",
  "backbone",
  "sha256",
  "when",
  "text!templates/login.htm",
  "text!templates/login-retred.htm",
  "bootstrap",
  "css!/css/login"
], function ($, _, Backbone, sha256, when, template, localLoginTemplate) {

  var Login = Backbone.View.extend({
    el: "#login-holder",

    initialize: function (/*options*/) {
    },

    render: function () {
      this.$el.html(template);

      this.$("#login").on("click", _.bind(this.handleLogin, this));

      this.$("#login-retred").popover({
        placement: "top",
        html: true,
        animation: false,
        content: localLoginTemplate
      });
      this.$("#login-retred").on("shown.bs.popover", _.bind(this.handleLoginShown, this));
   
      // this.$("#login-retred").on("click", _.bind(this.handleRetredLogin, this));
      this.$("#login-facebook").on("click", _.bind(this.handleFacebookLogin, this));

      return this.$el;
    },

    handleLoginShown: function () {
      this.$(".popover .register").on("click", _.bind(this.handleRegister, this));
      this.$(".popover .login").on("click", _.bind(this.handleLogin, this));
      this.$(".popover .dismiss").on("click", _.bind(this.handleClose, this));
      this.$(".popover form input[name=username]").focus();
      this.$(".popover form").on("submit", _.bind(this.handleLogin, this));
    },

    handleRegister: function () {
      when($.post("/register", {
        username: this.$(".popover form input[name=username]").val(),
        password: sha256.SHA256(this.$(".popover form input[name=password]").val()).toString()
      })).then(
        _.bind(function () {
          window.console.log("done", arguments);
          this.$("#login-retred").popover("toggle");
        }, this), 
        this.handleFailedRequest("Registration failed")
      );
    },

    handleLogin: function (e) {
      when($.post("/login", {
        username: this.$(".popover form input[name=username]").val(),
        password: sha256.SHA256(this.$(".popover form input[name=password]").val()).toString()
      })).then(
        _.bind(function () {
          window.console.log("done", arguments);
          this.$("#login-retred").popover("toggle");
        }, this),
        this.handleFailedRequest("Login failed")
      );
      e.preventDefault();
    },

    handleFailedRequest: function (defaultErrorMessage) {
      return _.bind(function (err) {

        var movePopup = false;
        if (!this.$(".popover form .alert").is(":visible")) {
          movePopup = true;
        }

        var oldMargin = 
          parseInt(this.$(".popover form .alert").css("margin-top"), 10) + 
          parseInt(this.$(".popover form .alert").css("margin-bottom"), 10);

        this.$(".popover form .alert").text(err.responseText || defaultErrorMessage);
        this.$(".popover form .alert").show();

        if (movePopup) {
          this.$(".popover").css("top", 
            parseInt(this.$(".popover").css("top"), 10) - 
            (
              parseInt(this.$(".popover form .alert").css("height"), 10) +
              oldMargin
            )
          );
        }
      }, this);
    },

    handleClose: function () {
      this.$("#login-retred").popover("toggle");
    },

    handleRetredLogin: function () {
    },

    handleFacebookLogin: function () {
      
    }

  });

  return Login;

});