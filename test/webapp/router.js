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
          importance: 125,
          filterState: new Backbone.Collection(),
          highlight: {}
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
          sinon.stub(this.router, "filteredQueryHighlightedMapView");
        });
        afterEach(function () {
          this.router.filteredQueryHighlightedMapView.restore();
        });
        it("should call filteredQueryHighlightedMapView with no filter, query or highlight from mapView", function () {
          this.router.mapView(1, 2, 3, 4, 5, 125);
          this.router.filteredQueryHighlightedMapView.calledWith(1, 2, 3, 4, 5, 125, null, null).should.equal(true);
        });
        it("should call filteredQueryHighlightedMapView with a filter but no query or highlight from filteredMapView", function () {
          this.router.filteredMapView(1, 2, 3, 4, 5, 125, "some filters");
          this.router.filteredQueryHighlightedMapView.calledWith(1, 2, 3, 4, 5, 125, "some filters", null, null).should.equal(true);
        });
        it("should call filteredQueryHighlightedMapView with query but no filter or highlight from queryMapView", function () {
          this.router.queryMapView(1, 2, 3, 4, 5, 125, "searchString");
          this.router.filteredQueryHighlightedMapView.calledWith(1, 2, 3, 4, 5, 125, null, "searchString", null).should.equal(true);
        });
        it("should call filteredQueryHighlightedMapView with query and highlight but no filter from queryHighlightedMapView", function () {
          this.router.queryHighlightedMapView(1, 2, 3, 4, 5, 125, "searchString", "[1]");
          this.router.filteredQueryHighlightedMapView.calledWith(1, 2, 3, 4, 5, 125, null, "searchString", "[1]").should.equal(true);
        });
      });
      describe("filteredQueryHighlightedMapView", function () {
        it("should not set the query when the parameter is null", function () {
          this.router.model = new Backbone.Model();
          this.router.filteredQueryHighlightedMapView(1, 2, 3, 4, 5, null, null, null);
          (this.router.model.get("query") === null).should.equal(true);
        });
        it("should not trigger an event if nothing has changed", function () {
          var changeCalled = false;
          this.model.set("query", null);
          this.model.set("highlight", {});
          this.router.model = this.model;
          this.router.model.on("change", function () {
            changeCalled = true;
          });
          this.router.filteredQueryHighlightedMapView(1, 1, 3, 1900, 2000, 125, null, null, null);
          changeCalled.should.equal(false);
        });
        _.each(["date", "center", "zoom", "query", "importance"], function (key) {
          it("should not set '" + key + "' on the model if it has not changed", function () {
            this.router.model = this.model;
            this.model.set("query", "some query");
            sinon.stub(this.router.model, "set");
            this.router.filteredQueryHighlightedMapView(1, 1, 3, 1900, 2000, 125, null, "some query", null);
            (this.router.model.set.args[0][0][key] === undefined).should.equal(true);
          });
        });
        it("should trigger an event if the filterState has changed", function () {
          this.router.model = this.model;
          var called = false;
          this.model.on("change:filterState", function () {
            called = true;
          });
          this.router.filteredQueryHighlightedMapView(1, 1, 3, 1900, 2000, 125, "1:*", "some query", null);
          called.should.equal(true);
        });
        it("should not trigger an event if the filterState has not changed", function () {
          this.router.model = this.model;
          var called = false;
          FilterUrlSerialiser.deserialise("1:*", this.model);
          this.model.on("change:filterState", function () {
            called = true;
          });
          this.router.filteredQueryHighlightedMapView(1, 1, 3, 1900, 2000, 125, "1:*", "some query", null);
          called.should.equal(false);
        });
      });
      describe("process changes", function () {
        beforeEach(function () {
          this.router = new Router();
          sinon.stub(this.router, "filteredQueryHighlightedMapView");
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
        it("should navigate with the importance value", function () {
          this.router.init({model: this.model});
          this.router.handleChange();
          /importance\/125/.test(this.location).should.equal(true);
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
        it("should navigate with highlight value if it and query is set", function () {
          this.model.set("highlight", {id: 1});
          this.model.set("query", "searchString");
          this.router.init({model: this.model});
          this.router.handleChange();
          /highlight\/1/.test(this.location).should.equal(true);
        });
        it("should not navigate with highlight value if it is not set", function () {
          this.model.set("query", "some search string");
          this.router.init({model: this.model});
          this.router.handleChange();
          /highlight/.test(this.location).should.equal(false);
        });
        it("should not navigate with highlight value if no query is set", function () {
          this.model.set("highlight", [{id: 1}]);
          this.router.init({model: this.model});
          this.router.handleChange();
          /highlight\/\[1\]/.test(this.location).should.equal(false);
        });
        it("should navigate with the query value if it is set", function () {
          this.model.set("query", "some search string");
          this.router.init({model: this.model});
          this.router.handleChange();
          /query\/some%20search%20string/.test(this.location).should.equal(true);
        });
        it("should not navigate with query value if it is not set", function () {
          this.model.set("query", null);
          this.router.init({model: this.model});
          this.router.handleChange();
          /query\//.test(this.location).should.equal(false);
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
    });
  }
);
