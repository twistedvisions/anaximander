require.config({
  shim: {
    "backbone": {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },
    "bootstrap": {
      deps: ["jquery"]
    },
    "underscore_string": {
      deps: ["underscore"],
      exports: "underscore_string"
    }
  },
  map: {
    "*": {
      "less": "libs/bower/require-less/less"
    }
  },
  paths: {

    "backbone": "./libs/bower/backbone/backbone",
    "bootstrap": "./libs/bower/bootstrap/bootstrap",
    "jquery": "./libs/bower/jquery/jquery",
    "moment": "./libs/bower/momentjs/moment",
    "text": "./libs/bower/requirejs-text/text",
    "underscore": "./libs/bower/lodash/lodash.compat",
    "underscore_string": "./libs/bower/underscore.string/lib/underscore.string",
    "when": "./libs/bower/when/when",

    "templates": "../templates"
  }
});

require([
  "jquery",
  "views/type_listing",
  "models/current_user",
  "bootstrap"
], function ($, AppView, User) {

  User.user = new User({
    id: -1,
    permissions: []
  });
  User.user.fetch({
    success: function () {
      var app = new AppView().render();
      $("body").append(app);
    },
    failure: function () {
      window.console.log("failed to log in");
    }
  });
});