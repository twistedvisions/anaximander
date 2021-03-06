define([
  "jquery",
  "underscore",
  "backbone",
  "bootstrap",
  "cryptojs.sha256",
  "when",
  "analytics",
  "models/current_user",
  "text!templates/login-retred.htm",
  "bootstrap",
  "less!../../css/login"
], function ($, _, Backbone, bootstrap, cryptojs, when, Analytics, User, template) {

  var Login = Backbone.View.extend({
    registrationFailedMessage: "Registration failed",
    loginFailedMessage: "Login failed",
    noUsernameMessage: "a username must be given",
    noPasswordMessage: "a password must be given",

    initialize: function (/*options*/) {
    },

    render: function () {
      this.$("#login-retred").popover({
        placement: "top",
        html: true,
        animation: false,
        content: template
      });
      this.$("#login-retred").on("shown.bs.popover", _.bind(this.handleLoginShown, this));

      return this.$el;
    },

    handleLoginShown: function () {
      Analytics.loginAttempted({
        provider: "local"
      });
      this.$(".popover .register").on("click", _.bind(this.handleRegister, this));
      this.$(".popover .login").on("click", _.bind(this.handleLogin, this));
      this.$(".popover .dismiss").on("click", _.bind(this.handleClose, this));
      this.$(".popover form input[name=username]").focus();
      this.$(".popover form").on("submit", _.bind(this.handleLogin, this));
    },

    handleRegister: function () {
      var username = this.$(".popover form input[name=username]").val();
      var password = this.$(".popover form input[name=password]").val();

      if (username.length === 0) {
        this.handleFailedRequest(this.noUsernameMessage, {});
      } else if (password.length === 0) {
        this.handleFailedRequest(this.noPasswordMessage, {});
      } else {
        when($.post("/register", {
          username: this.$(".popover form input[name=username]").val(),
          password: cryptojs.SHA256(this.$(".popover form input[name=password]").val()).toString()
        })).then(
          _.bind(this.handleRegisterSuccess, this),
          _.bind(this.handleRegisterFailure, this)
        );
      }
    },

    handleRegisterSuccess: function (user) {
      Analytics.register(_.extend({
        provider: "local"
      }, user));
      this.logUserIn(user);
    },

    handleRegisterFailure: function (err) {
      this.handleFailedRequest(this.registrationFailedMessage, err);
    },

    handleLogin: function (e) {
      var username = this.$(".popover form input[name=username]").val();
      var password = this.$(".popover form input[name=password]").val();
      when($.post("/login", {
        username: username,
        password: cryptojs.SHA256(password).toString()
      })).then(
        _.bind(this.handleLoginSuccess, this),
        _.bind(this.handleLoginFailure, this)
      );
      e.preventDefault();
    },

    handleLoginSuccess: function (user) {
      Analytics.loginSucceeded(_.extend({
        provider: "local"
      }, user));
      this.logUserIn(user);
    },

    logUserIn: function (user) {
      this.$("#login-retred").popover("toggle");
      User.user.set("logged-in", true);
      User.user.set("permissions", user.permissions);
    },

    handleLoginFailure: function (err) {
      Analytics.loginFailed({
        provider: "local",
        message: err.responseText
      });
      this.handleFailedRequest(this.loginFailedMessage, err);
    },

    handleFailedRequest: function (defaultErrorMessage, err) {
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
    },

    handleClose: function () {
      this.$("#login-retred").popover("toggle");
    }

  });

  return Login;

});