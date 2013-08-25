require.config({
  shim: {
    'backbone': {
        deps: ['underscore', 'jquery'],
        exports: 'Backbone'
    },
    'jqueryui': {
        deps: ['jquery'],
        exports: '$'
    }
  },
  paths: {
    underscore: '//cdnjs.cloudflare.com/ajax/libs/lodash.js/1.3.1/lodash.min', // https://github.com/amdjs
    jquery: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min',
    jqueryui: "//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min",
    backbone: '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min', // https://github.com/amdjs
    text: '//cdnjs.cloudflare.com/ajax/libs/require-text/2.0.10/text',
    templates: '../templates'
  }
});

require([
  'views/app',
  'router'
], function(AppView, Router){
  var appView = new AppView();
  appView.render();
  Router.initialize({appView: appView}); 
});