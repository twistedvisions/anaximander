require.config({
  shim: {
    "backbone": {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },
    "bootstrap": {
      deps: ["jquery"]
    },
    "jqueryui": {
      deps: ["jquery"],
      exports: "$"
    },
    "datetimepicker": {
      deps: ["jqueryui"]
    },
    "styled_marker": {
      deps: ["async!//maps.googleapis.com/maps/api/js?key=" + window.googleApiKey +
        "&sensor=false!callback"],
      exports: "StyledMarker"
    },
    "chroma": {
      exports: "chroma"
    },
    "deep-diff": {
      exports: "DeepDiff"
    },
    "select2": {
      deps: ["jquery"],
      exports: "Select2"
    },
    "parsley": {
      deps: ["jquery"]
    },
    "underscore_string": {
      deps: ["underscore"],
      exports: "underscore_string"
    },
    "range-slider": {
      deps: ["jquery", "jqueryui"]
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
    "chroma": "./libs/bower/chroma-js/chroma",
    "cookies": "./libs/bower/cookies-js/cookies",
    "datetimepicker": "./libs/bower/jqueryui-timepicker-addon/src/jquery-ui-timepicker-addon",
    "deep-diff": "./libs/bower/deep-diff/index",
    "jquery": "./libs/bower/jquery/jquery",
    "jqueryui": "./libs/bower/jquery-ui/jquery-ui",
    "moment": "./libs/bower/momentjs/moment",
    "numeral": "./libs/bower/numeral/numeral",
    "parsley": "libs/bower/parsleyjs/parsley",
    "select2": "./libs/bower/select2/select2",
    "sha256": "./libs/bower/cryptojslib/sha256",
    "text": "./libs/bower/requirejs-text/text",
    "underscore": "./libs/bower/lodash/lodash.compat",
    "underscore_string": "./libs/bower/underscore.string/lib/underscore.string",

    // "when": "./libs/when",
    "when": "./libs/bower/when/when",

    "templates": "../templates",
    "async": "./libs/async",
    "fuse": "./libs/fuse",
    "range-slider": "libs/jQAllRangeSliders-min",
    "socketio": "../socket.io/socket.io",
    "styled_marker": "./libs/styled_marker"
  }
});

require([
  "anax_startup"
], function (App) {
  var app = new App();
  app.start();
});