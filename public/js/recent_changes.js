require.config({
  shim: {
    "backbone": {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },
    "bootstrap": {
      deps: ["jquery"]
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
    "when": "./libs/bower/when/when",

    "templates": "../templates"
  }
});

require([
  "jquery",
  "views/recent_changes",
  "bootstrap"
], function ($, AppView) {
  var app = new AppView().render();
  $("body").append(app);
});