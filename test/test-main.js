var tests = [];
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
      "css": "libs/require-css/css"
    }
  },

  cssDir:  "/base/public",

  paths: {
    underscore: "//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.0.0/lodash.min", // https://github.com/amdjs
    jquery: "//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min",
    jqueryui: "//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min",
    backbone: "//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min", // https://github.com/amdjs
    bootstrap: "//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.0.2/js/bootstrap.min",
    text: "//cdnjs.cloudflare.com/ajax/libs/require-text/2.0.10/text",
    chroma: "//cdnjs.cloudflare.com/ajax/libs/chroma-js/0.4.12/chroma.min",
    select2: "//cdnjs.cloudflare.com/ajax/libs/select2/3.4.1/select2.min",
    parsley: "//cdnjs.cloudflare.com/ajax/libs/parsley.js/1.1.16/parsley.min",
    templates: "../templates",
    async: "../../test/webapp/mocks/async",
    styled_marker: "./libs/styled_marker",
    underscore_string: "./libs/underscore_string",
    fuse: "./libs/fuse",
    when: "./libs/when",
    "deep-diff": "./libs/deep-diff",
    sha256: "./libs/sha256",
    cookies: "./libs/cookies",
    moment: "./libs/moment",
    "range-slider": "libs/jQAllRangeSliders-min",
    socketio: "../../node_modules/socket.io-client/dist/socket.io.min",
    datetimepicker: "./libs/datetimepicker"
  },

  deps: tests,

  callback: window.__karma__.start
});