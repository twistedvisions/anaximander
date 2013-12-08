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
    "styled_marker": {
      deps: ["async!//maps.googleapis.com/maps/api/js?key=" + window.googleApiKey + 
        "&sensor=false!callback"],
      exports: "StyledMarker"
    },
    "chroma": {
      exports: "chroma"
    },
    "select2": {
      deps: ["jquery"],
      exports: "Select2"
    },
    "parsley": {
      deps: ["jquery"]
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
    parsley: "//cdnjs.cloudflare.com/ajax/libs/parsley.js/1.1.16/parsley.min",
    templates: "../templates",
    async: "./libs/async",
    styled_marker: "./libs/styled_marker",
    fuse: "./libs/fuse"
  }
});

require([
  "views/app",
  "router",
  "models/view_state",
  "css!/css/anax"
], function (AppView, Router, ViewState) {
  var model = new ViewState({
    date: [1963, 2013],
    center: [53.24112905344493, 6.191539001464932],
    zoom: 9,
    radius: 10
  });
  var appView = new AppView({
    model: model
  });
  appView.render();
  this.router = new Router(); 
  this.router.init({
    model: model
  });
});