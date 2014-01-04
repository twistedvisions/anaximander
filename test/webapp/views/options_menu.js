/*global sinon, describe, beforeEach, afterEach, it */
/*jshint expr: true*/
define(
  ["jquery", "backbone", "views/options_menu", "analytics"],
  function ($, Backbone, OptionsMenu, Analytics) {
    
    var collection = new Backbone.Collection();
    collection.start = function () {};

    describe("interaction", function () {
      beforeEach(function () {
        sinon.stub(Analytics, "optionSelected");
      });

      afterEach(function () {
        Analytics.optionSelected.restore();
      });
        
      it("should track when the add event option is selected", function () {
        var optionsMenu = new OptionsMenu({event: {latLng: {
          lat: function () {},
          lng: function () {}
        }}});
        optionsMenu.handleAddEvent();
        Analytics.optionSelected.calledWith({option: "addEvent"}).should.equal(true);
      });

    });
  }
);
