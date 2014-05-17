var tests = ["es5-shim"];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/test\/webapp\/.*\.js$/.test(file)) {
      tests.push(file);
    }
  }
}

require.config({

  baseUrl: "/base/public/js",
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

  cssDir:  "/base/public",

  paths: {
    "async": "./libs/bower/requirejs-plugins/async",
    "backbone": "./libs/bower/backbone/backbone",
    "bootstrap": "./libs/bower/bootstrap/bootstrap",
    "chroma": "./libs/bower/chroma-js/chroma",
    "cookies": "./libs/bower/cookies-js/cookies",
    "datetimepicker": "./libs/bower/jqueryui-timepicker-addon/src/jquery-ui-timepicker-addon",
    "deep-diff": "./libs/bower/deep-diff/index",
    "jquery": "./libs/bower/jquery/jquery",
    "jqueryui": "./libs/bower/jquery-ui/jquery-ui",

    "less": "./libs/bower/require-less/less",
    "less-builder": "./libs/bower/require-less/less-builder",
    // "normalize": "./libs/bower/require-less/normalize",

    "moment": "./libs/bower/momentjs/moment",
    "numeral": "./libs/bower/numeral/numeral",
    "parsley": "libs/bower/parsleyjs/parsley",
    "select2": "./libs/bower/select2/select2",
    "sha256": "./libs/bower/cryptojslib/sha256",
    "socketio": "./libs/bower/socket.io-client/dist/socket.io",
    "text": "./libs/bower/requirejs-text/text",
    "underscore": "./libs/bower/lodash/lodash.compat",
    "underscore_string": "./libs/bower/underscore.string/lib/underscore.string",
    "when": "./libs/bower/when/when",

    "es5-shim": "./libs/bower/es5-shim/es5-shim",

    "templates": "../templates",
    "fuse": "./libs/fuse",
    "range-slider": "libs/jQAllRangeSliders-min",
    "styled_marker": "./libs/styled_marker"
  },

  deps: tests,

  callback: window.__karma__.start
});