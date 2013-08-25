var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/test\/webapp\/.*\.js$/.test(file)) {
      tests.push(file);
    }
  }
}

require.config({

  baseUrl: '/base/public/js',
  shim: {
    "backbone": {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },
    "jqueryui": {
      deps: ["jquery"],
      exports: "$"
    },
    "styled_marker": {
      deps: ["async!//maps.googleapis.com/maps/api/js?key=" + window.googleApiKey + 
        "&sensor=false!callback"],
      exports: "StyledMarker"
    }
  },
  paths: {
    underscore: "//cdnjs.cloudflare.com/ajax/libs/lodash.js/1.3.1/lodash.min", // https://github.com/amdjs
    jquery: "//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min",
    jqueryui: "//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min",
    backbone: "//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min", // https://github.com/amdjs
    text: "//cdnjs.cloudflare.com/ajax/libs/require-text/2.0.10/text",
    templates: "../templates",
    async: "./libs/async",
    styled_marker: "./libs/styled_marker"
  },
  
  deps: tests,

  
  callback: window.__karma__.start
});