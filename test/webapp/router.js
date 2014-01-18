/*global sinon, describe, before, after, beforeEach, afterEach, it */
/*jshint expr: true*/
define(
  ["underscore", "backbone", "router",
   "utils/filter_url_serialiser"],
  function (_, Backbone, Router, FilterUrlSerialiser) {
    describe("router", function () {

      beforeEach(function () {
        this.model = new Backbone.Model({
          center: [1, 1],
          date: [1900, 2000],
          zoom: 3,
          filterState: new Backbone.Collection()
        });
        this.router = new Router();
      });

      afterEach(function () {
        Backbone.history.stop();
      });

      it("should navigate on model changes", function () {
        this.router.init({model: this.model});
        var navigate = sinon.stub(this.router, "navigate");
        this.model.set("zoom", 2);
        navigate.calledOnce.should.equal(true);
      });
      describe("routes", function () {
        beforeEach(function () {
          sinon.stub(this.router, "filteredHighlightedMapView");
        });
        afterEach(function () {
          this.router.filteredHighlightedMapView.restore();
        });
        it("should call filteredHighlightedMapView with no filter or highlights from mapView", function () {
          this.router.mapView(1, 2, 3, 4, 5);
          this.router.filteredHighlightedMapView.calledWith(1, 2, 3, 4, 5, null, null).should.equal(true);
        });
        it("should call filteredHighlightedMapView with a filter but no highlights from filteredMapView", function () {
          this.router.filteredMapView(1, 2, 3, 4, 5, "some filters");
          this.router.filteredHighlightedMapView.calledWith(1, 2, 3, 4, 5, "some filters", null).should.equal(true);
        });
        it("should call filteredHighlightedMapView with highlights but no filter from highlightedMapView", function () {
          this.router.highlightedMapView(1, 2, 3, 4, 5, "[1]");
          this.router.filteredHighlightedMapView.calledWith(1, 2, 3, 4, 5, null, "[1]").should.equal(true);
        });
      });
      describe("process changes", function () {
        beforeEach(function () {
          this.router = new Router();
          sinon.stub(this.router, "filteredHighlightedMapView");
          sinon.stub(this.router, "navigate", _.bind(function (location) {
            this.location = location;
          }, this));
        });
        it("should navigate with a center value", function () {
          this.model.set("center", [10, -20]);
          this.router.init({model: this.model});
          this.router.handleChange();
          /lat\/10\/lon\/-20/.test(this.location).should.equal(true);
        });
        it("should navigate with the dates value", function () {
          this.router.init({model: this.model});
          this.router.handleChange();
          /start\/1900\/end\/2000/.test(this.location).should.equal(true);
        });
        it("should navigate with the zoom value", function () {
          this.router.init({model: this.model});
          this.router.handleChange();
          /zoom\/3\//.test(this.location).should.equal(true);
        });
        it("should navigate with filterstate value if it is set", function () {
          FilterUrlSerialiser.deserialise("1:u", this.model);
          this.router.init({model: this.model});
          this.router.handleChange();
          /filter\/1:u/.test(this.location).should.equal(true);
        });
        it("should not navigate with filterstate value if it is not set", function () {
          this.router.init({model: this.model});
          this.router.handleChange();
          /filter\//.test(this.location).should.equal(false);
        });
        it("should navigate with highlights value if it is set", function () {
          this.model.set("highlights", [1]);
          this.router.init({model: this.model});
          this.router.handleChange();
          /highlights\/\[1\]/.test(this.location).should.equal(true);
        });
        it("should not navigate with highlights value if it is not set", function () {
          this.router.init({model: this.model});
          this.router.handleChange();
          /highlights\//.test(this.location).should.equal(false);
        });
      });
      describe("interaction", function () {
        before(function () {
          sinon.stub(Backbone.history, "getFragment", function () {
            return "lat/50.54495764863934/lon/20.716353047688926/zoom/5/start/1349/end/1572";
          });
        });
        it("should set lastEvent to 'url_change'", function () {
          var model = new Backbone.Model({
            center: [1, 2],
            date: [1900, 2000],
            zoom: 3,
            filterState: new Backbone.Collection()
          });

          var router = new Router();
          router.init({model: model});
          window.lastEvent.should.equal("url_change");
        });
        after(function () {
          sinon.restore(Backbone.history.getFragment);
        });
      });
      describe("startup", function () {
        beforeEach(function () {
          if (window.navigator && window.navigator.geolocation) {
            sinon.stub(window.navigator.geolocation, "getCurrentPosition");
          } else {
            this.oldGeolocationObject = window.navigator.geolocation;
            window.navigator.geolocation = {
              getCurrentPosition: function () {}
            };
          }
        });
        afterEach(function () {
          if (navigator.geolocation.getCurrentPosition.restore) {
            navigator.geolocation.getCurrentPosition.restore();
          } else {
            window.navigator.geolocation = this.oldGeolocationObject;
          }
        });
        it("should get the user's position if no position is set in the url", function () {
          var model = new Backbone.Model({
            center: [1, 2],
            date: [1900, 2000],
            zoom: 3,
            filterState: new Backbone.Collection()
          });

          var router = new Router();
          router.setFromUrl = false;
          router.init({model: model});
        });
        it("should not get the user's position if a position is set in the url", function () {
          var model = new Backbone.Model({
            center: [1, 2],
            date: [1900, 2000],
            zoom: 3,
            filterState: new Backbone.Collection()
          });

          var router = new Router();
          router.setFromUrl = true;
          router.init({model: model});
        });
      });
    });
  }
);
