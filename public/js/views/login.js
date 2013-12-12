define([
  "jquery",
  "underscore",
  "backbone",
  "./login_local",
  "text!templates/login.htm",
  "text!templates/login-retred.htm",
  "bootstrap",
  "css!/css/login"
], function ($, _, Backbone, LoginLocal, template) {

  var Login = Backbone.View.extend({
    el: "#login-holder",

    initialize: function (/*options*/) {
    },

    render: function () {
      this.$el.html(template);

      this.$("#login").on("click", _.bind(this.handleLogin, this));

      new LoginLocal({
        el: "#login-holder",
        target: "#login-retred"
      }).render();

      // this.$("#login-retred").on("click", _.bind(this.handleRetredLogin, this));
      this.$("#login-facebook").on("click", _.bind(this.handleFacebookLogin, this));

      return this.$el;
    },

    handleLogin: function () {
      this.$("#login-options").show();
    },

    handleFacebookLogin: function () {
      
    }

  });

  return Login;

});