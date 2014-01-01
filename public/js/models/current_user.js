define([
  "underscore",
  "jquery",
  "backbone",
  "analytics"
], function (_, $, Backbone, Analytics) {
  var CurrentUser = Backbone.Model.extend({
    "url": "/current-user",
    "logged-in": false,
    initialize: function () {
      this.on("change:permissions", this._updatePermissions, this);
      this._updatePermissions();
    },
    _updatePermissions: function () {
      var oldPermissionMap = this.get("permissionMap");
      var oldLoginPermission = oldPermissionMap && oldPermissionMap.login;
      this.set("permissionMap", _.indexBy(this.get("permissions"), "name"));
      if (oldLoginPermission) {
        this.get("permissionMap").login = oldLoginPermission;
      }
    },
    logout: function () {
      if (this.get("logged-in")) {
        $.post("/logout", _.bind(function (user) {
          Analytics.logout(user);
          this.set("logged-in", false);
        }, this));
      }
    },
    hasPermission: function (permission) {
      return !!this.get("permissionMap")[permission];
    }
  });
  return CurrentUser;
});
