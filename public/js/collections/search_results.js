define([
  "underscore",
  "backbone",
  "models/search_result"
], function (_, Backbone, SearchResult) {

  var searchResults = Backbone.Collection.extend({
    model: SearchResult,
    url: "search",
    parse: function (results) {
      results = _.map(results, function (x) {
        x.start_date = new Date(x.start_date);
        x.end_date = new Date(x.end_date);
        return x;
      });
      return results;
    }
  });

  return searchResults;
});