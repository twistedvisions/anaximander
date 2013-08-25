define([
  'jquery',
  'underscore',
  'backbone'
], function ($, _, Backbone) {
  var AppRouter = Backbone.Router.extend({
    routes: {
      // Pages
      'manager': 'manager',
      
      // Default - catch all
      '*actions': 'defaultAction'
    }
  });

  var initialize = function(options){
    var appView = options.appView;
    var router = new AppRouter(options);
   // router.on('route:defaultAction', function (actions) {
   //    require(['views/dashboard/page'], function (DashboardPage) {
   //      var dashboardPage = Vm.create(appView, 'DashboardPage', DashboardPage);
   //      dashboardPage.render();
   //    });
   //  });
    // router.on('route:manager', function () {
    //   require(['views/manager/page'], function (ManagerPage) {
    //     var managerPage = Vm.create(appView, 'ManagerPage', ManagerPage);
    //     managerPage.render();
    //   });
    // });
    Backbone.history.start();
  };
  return {
    initialize: initialize
  };
});