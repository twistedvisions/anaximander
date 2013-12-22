define([
  "underscore",
  "jquery",
  "backbone"
], function (_, $, Backbone) {
  var CurrentUser = Backbone.Model.extend({
    "url": "/current-user",
    "logged-in": false,
    logout: function () {
      if (this.get("logged-in")) {
        $.post("/logout", _.bind(function () {
          this.set("logged-in", false);
        }, this));
      }
    }
  });
  return CurrentUser;
});