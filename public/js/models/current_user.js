define([
  "underscore",
  "jquery",
  "backbone",
  "analytics"
], function (_, $, Backbone, Analytics) {
  var CurrentUser = Backbone.Model.extend({
    "url": "/current-user",
    "logged-in": false,
    logout: function () {
      if (this.get("logged-in")) {
        $.post("/logout", _.bind(function (user) {
          Analytics.logout(user);
          this.set("logged-in", false);
        }, this));
      }
    }
  });
  return CurrentUser;
});