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
    "moment-range": {
      deps: ["moment"]
    },
    "underscore_string": {
      deps: ["underscore"],
      exports: "underscore_string"
    },
    "range-slider": {
      deps: ["jquery", "jqueryui"]
    },
    "cryptojs.core": {
      exports: "CryptoJS"
    },
    "cryptojs.sha256": {
      deps: ["cryptojs.core"],
      exports: "CryptoJS"
    }
  },
  map: {
    "*": {
      "less": "libs/bower/require-less/less"
    }
  },
  paths: {
    "css": "./css",

    "async": "./libs/bower/requirejs-plugins/async",
    "backbone": "./libs/bower/backbone/backbone",
    "bootstrap": "./libs/bower/bootstrap/bootstrap",
    "chroma": "./libs/bower/chroma-js/chroma",
    "cookies": "./libs/bower/cookies-js/cookies",
    "cryptojs.core": "./libs/bower/cryptojslib/core",
    "cryptojs.sha256": "./libs/bower/cryptojslib/sha256",
    "datetimepicker": "./libs/bower/jqueryui-timepicker-addon/src/jquery-ui-timepicker-addon",
    "deep-diff": "./libs/bower/deep-diff/index",
    "jquery": "./libs/bower/jquery/jquery",
    "jqueryui": "./libs/bower/jquery-ui/jquery-ui",
    "less": "./libs/bower/require-less/less",
    "moment": "./libs/bower/momentjs/moment",
    "moment-range": "./libs/bower/moment-range/moment-range",
    "numeral": "./libs/bower/numeral/numeral",
    "parsley": "libs/bower/parsleyjs/parsley",
    "select2": "./libs/bower/select2/select2",
    "socketio": "./libs/bower/socket.io-client/dist/socket.io",
    "text": "./libs/bower/requirejs-text/text",
    "underscore": "./libs/bower/lodash/lodash.compat",
    "underscore_string": "./libs/bower/underscore.string/lib/underscore.string",
    "when": "./libs/bower/when/when",

    "templates": "../templates",
    "fuse": "./libs/fuse",
    "styled_marker": "./libs/styled_marker"
  }
});

require([
  "anax_startup"
], function (App) {
  var app = new App();
  app.start();
});