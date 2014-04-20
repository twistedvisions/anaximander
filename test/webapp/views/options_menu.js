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

      it("should place the options relative to the parent", function () {
        var optionsMenu = new OptionsMenu({
          event: {
            latLng: {
              lat: function () {},
              lng: function () {}
            },
            pixel: {
              x: 200,
              y: 100
            }
          },
          parent: {
            position: function () {
              return {
                top: 16,
                left: 150
              };
            }
          }
        });
        var args;
        optionsMenu.$el = {
          html: sinon.stub(),
          appendTo: function () {
            return {
              css: function () {
                args = arguments;
              }
            };
          },
          find: function () {
            return {
              on: sinon.stub()
            };
          }
        };
        optionsMenu.render();

        args[0].top.should.equal(116);
        args[0].left.should.equal(350);
      });

      it("should track when the add event option is selected", function () {
        var optionsMenu = new OptionsMenu({
          event: {
            latLng: {
              lat: function () {},
              lng: function () {}
            }
          }
        });
        sinon.stub(optionsMenu, "showEventEditor");
        optionsMenu.handleAddEvent({preventDefault: function () {}});
        Analytics.optionSelected.calledWith({option: "addEvent"}).should.equal(true);
      });

    });
  }
);
