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
    underscore: "//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.0.0/lodash.min", // https://github.com/amdjs
    jquery: "//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min",
    backbone: "//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min", // https://github.com/amdjs
    bootstrap: "//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.0.2/js/bootstrap.min",
    text: "//cdnjs.cloudflare.com/ajax/libs/require-text/2.0.10/text",
    templates: "../templates",
    when: "./libs/bower/when/when",
    underscore_string: "./libs/underscore_string",
    moment: "./libs/moment"
  }
});

require([
  "jquery",
  "views/type_listing",
  "models/current_user",
  "bootstrap"
], function ($, AppView, User) {

  var user = new User({
    id: -1,
    permissions: []
  });
  user.fetch({
    success: function () {
      var app = new AppView({
        user: user
      }).render();
      $("body").append(app);
    },
    failure: function () {
      window.console.log("failed to log in");
    }
  });
});