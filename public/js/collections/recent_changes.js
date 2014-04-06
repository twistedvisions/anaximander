define([
  "underscore",
  "backbone",
  "models/recent_change"
], function (_, Backbone, RecentChange) {

  var RecentChanges = Backbone.Collection.extend({
    model: RecentChange,
    url: "change/recent"//,

    // parse: function (results) {
    //   results = _.map(results, function (x) {
    //     return x;
    //   });
    //   return results;
    // }
  });

  return RecentChanges;
});
