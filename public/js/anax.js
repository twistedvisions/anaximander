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
      "css": "libs/require-css/css"
    }
  },
  paths: {
    underscore: "//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.0.0/lodash.min", // https://github.com/amdjs
    jquery: "//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min",
    jqueryui: "//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min",
    backbone: "//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min", // https://github.com/amdjs
    bootstrap: "//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.0.2/js/bootstrap.min",
    text: "//cdnjs.cloudflare.com/ajax/libs/require-text/2.0.10/text",
    chroma: "//cdnjs.cloudflare.com/ajax/libs/chroma-js/0.4.12/chroma.min",
    select2: "//cdnjs.cloudflare.com/ajax/libs/select2/3.4.1/select2.min",
    parsley: "libs/parsley",
    templates: "../templates",
    async: "./libs/async",
    when: "./libs/when",
    "deep-diff": "./libs/deep-diff",
    styled_marker: "./libs/styled_marker",
    underscore_string: "./libs/underscore_string",
    fuse: "./libs/fuse",
    sha256: "./libs/sha256",
    "range-slider": "libs/jQAllRangeSliders-min",
    "socketio": "../socket.io/socket.io",
    cookies: "./libs/cookies",
    moment: "./libs/moment",
    datetimepicker: "./libs/datetimepicker"
  }
});

require([
  "anax_startup"
], function (App) {
  var app = new App();
  app.start();
});