define(["jquery", "underscore"], function ($, _) {
  var isBound = false;
  return {
    bindGlobalParsleyListener: function () {
      if (!isBound) {
        $.listen("parsley:field:success", _.bind(function () {
          _.defer(_.bind(function () {
            $("ul.parsley-errors-list:not(.filled)").removeClass("alert alert-danger");
          }, this));
        }, this));
        $.listen("parsley:field:error", _.bind(function () {
          _.defer(_.bind(function () {
            $("ul.parsley-errors-list.filled").addClass("alert alert-danger");
          }, this));
        }, this));
        isBound = true;
      }
    }
  };
});