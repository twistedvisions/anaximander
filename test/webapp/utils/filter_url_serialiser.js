/*global describe, beforeEach, it */
define(

  ["backbone", "utils/filter_url_serialiser"],

  function (Backbone, FilterUrlSerialiser) {

    beforeEach(function () {
      this.model = new Backbone.Model({
        filterState: new Backbone.Collection()
      });
    });

    describe("serialisation", function () {

      it("should return an empty string when nothing to serialise", function () {
        FilterUrlSerialiser.serialise(this.model).should.equal("");
      });

      describe("thing type filters", function () {

        it("should return <id>:* when only a primary", function () {
          this.model.get("filterState").set([{id: 1}], {remove: false});
          FilterUrlSerialiser.serialise(this.model).should.equal("1:*");
        });

        it("should return <id>:u when only an unspecified", function () {
          this.model.get("filterState").set([{id: -1, parent_type_id: 1}], {remove: false});
          FilterUrlSerialiser.serialise(this.model).should.equal("1:u");
        });

        it("should return <id>:<id> when only a secondary", function () {
          this.model.get("filterState").set([{id: 2, parent_type_id: 1}], {remove: false});
          FilterUrlSerialiser.serialise(this.model).should.equal("1:2");
        });

        it("should return <id>:u,<id> when an unspecified and a secondary", function () {
          this.model.get("filterState").set(
            [{id: -1, parent_type_id: 1}, {id: 2, parent_type_id: 1}],
            {remove: false}
          );
          FilterUrlSerialiser.serialise(this.model).should.equal("1:u,2");
        });

        it("should return handle multiple primary filter keys", function () {
          this.model.get("filterState").set([{id: 1}, {id: 2}], {remove: false});
          FilterUrlSerialiser.serialise(this.model).should.equal("1:*;2:*");
        });

      });

      describe("non-thing type filters", function () {

        it("should return <id>:* when only a primary", function () {
          this.model.get("filterState").set([{id: "r"}], {remove: false});
          FilterUrlSerialiser.serialise(this.model).should.equal("r:*");
        });

        it("should return <id>:u when only an unspecified", function () {
          this.model.get("filterState").set([{id: "r.ns", parent_type_id: "r"}], {remove: false});
          FilterUrlSerialiser.serialise(this.model).should.equal("r:u");
        });

        it("should return <id>:<id> when only a secondary", function () {
          this.model.get("filterState").set([{id: "r2", parent_type_id: "r"}], {remove: false});
          FilterUrlSerialiser.serialise(this.model).should.equal("r:2");
        });

        it("should return <id>:u,<id> when an unspecified and a secondary", function () {
          this.model.get("filterState").set(
            [{id: "r.ns", parent_type_id: "r"}, {id: "r2", parent_type_id: "r"}],
            {remove: false}
          );
          FilterUrlSerialiser.serialise(this.model).should.equal("r:u,2");
        });

        it("should return handle multiple primary filter keys", function () {
          this.model.get("filterState").set([{id: "r"}, {id: "et"}], {remove: false});
          FilterUrlSerialiser.serialise(this.model).should.equal("et:*;r:*");
        });

      });

      it("should not confused the same ids with different parents", function () {
        this.model.get("filterState").set([
          {id: 7, parent_type_id: 5},
          {id: "r7", parent_type_id: "r"}
        ], {remove: false});
        FilterUrlSerialiser.serialise(this.model).should.equal("5:7;r:7");
      });

      it("should return handle a combination of everything", function () {
        this.model.get("filterState").set([
          {id: 1},
          {id: -2, parent_type_id: 2},
          {id: -3, parent_type_id: 3},
          {id: 4, parent_type_id: 3},
          {id: 6, parent_type_id: 5},
          {id: 7, parent_type_id: 5},
          {id: "r.ns", parent_type_id: "r"},
          {id: "r7", parent_type_id: "r"},
          {id: "et"}

        ], {remove: false});
        FilterUrlSerialiser.serialise(this.model).should.equal("1:*;2:u;3:u,4;5:6,7;et:*;r:u,7");
      });

    });

    describe("deserialisation", function () {

      it("should product an empty object when deserialising an empty string", function () {
        FilterUrlSerialiser.deserialise("", this.model).get("filterState").length.should.equal(0);
      });


      describe("thing type filters", function () {

        it("should produce a primary when string is <id>:*", function () {
          FilterUrlSerialiser.deserialise("1:*", this.model);
          var json = JSON.stringify(this.model.get("filterState").toJSON());
          json.should.equal("[{\"id\":1}]");
        });

        it("should produce a not specified filter when string is <id>:u", function () {
          FilterUrlSerialiser.deserialise("1:u", this.model);
          var json = JSON.stringify(this.model.get("filterState").toJSON());
          json.should.equal("[{\"id\":-1,\"parent_type_id\":1}]");
        });

        it("should produce a secondary when string is <id>:<id>", function () {
          FilterUrlSerialiser.deserialise("1:2", this.model);
          var json = JSON.stringify(this.model.get("filterState").toJSON());
          json.should.equal("[{\"id\":2,\"parent_type_id\":1}]");
        });

        it("should produce an unspecified and a secondary when string is <id>:u,<id>", function () {
          FilterUrlSerialiser.deserialise("1:u,2", this.model);
          var json = JSON.stringify(this.model.get("filterState").toJSON());
          json.should.equal("[{\"id\":-1,\"parent_type_id\":1},{\"id\":2,\"parent_type_id\":1}]");
        });

        it("should produce multiple primary filter keys", function () {
          FilterUrlSerialiser.deserialise("1:*;2:*", this.model);
          var json = JSON.stringify(this.model.get("filterState").toJSON());
          json.should.equal("[{\"id\":1},{\"id\":2}]");
        });

      });

      describe("non-thing type filters", function () {

        it("should produce a primary when string is <id>:*", function () {
          FilterUrlSerialiser.deserialise("r:*", this.model);
          var json = JSON.stringify(this.model.get("filterState").toJSON());
          json.should.equal("[{\"id\":\"r\"}]");
        });

        it("should produce a not specified filter when string is <id>:u", function () {
          FilterUrlSerialiser.deserialise("r:u", this.model);
          var json = JSON.stringify(this.model.get("filterState").toJSON());
          json.should.equal("[{\"id\":\"r.ns\",\"parent_type_id\":\"r\"}]");
        });

        it("should produce a secondary when string is <id>:<id>", function () {
          FilterUrlSerialiser.deserialise("r:2", this.model);
          var json = JSON.stringify(this.model.get("filterState").toJSON());
          json.should.equal("[{\"id\":\"r2\",\"parent_type_id\":\"r\"}]");
        });

        it("should produce an unspecified and a secondary when string is <id>:u,<id>", function () {
          FilterUrlSerialiser.deserialise("r:u,2", this.model);
          var json = JSON.stringify(this.model.get("filterState").toJSON());
          json.should.equal("[{\"id\":\"r.ns\",\"parent_type_id\":\"r\"},{\"id\":\"r2\",\"parent_type_id\":\"r\"}]");
        });

        it("should produce multiple primary filter keys", function () {
          FilterUrlSerialiser.deserialise("r:*;et:*", this.model);
          var json = JSON.stringify(this.model.get("filterState").toJSON());
          json.should.equal("[{\"id\":\"r\"},{\"id\":\"et\"}]");
        });
      });

      describe("getters", function () {
        describe("getTypeFilterKeys", function () {
          it("can ignore string types", function () {
            var filters = [
              new Backbone.Model({id: 1}),
              new Backbone.Model({id: "r"})
            ];
            FilterUrlSerialiser.getTypeFilterKeys(filters)
              .should.eql([{id: 1}, {id: "r"}]);
            FilterUrlSerialiser.getTypeFilterKeys(filters, true)
              .should.eql([{id: 1}]);
          });
        });
        describe("getSubtypeFilterKeys", function () {
          it("can ignore string types", function () {
            var filters = [
              new Backbone.Model({id: 1, parent_type_id: 1}),
              new Backbone.Model({id: "r1", parent_type_id: "r"})
            ];
            FilterUrlSerialiser.getSubtypeFilterKeys(filters)
              .should.eql([{id: 1, parent_type_id: 1}, {id: 1, parent_type_id: "r"}]);
            FilterUrlSerialiser.getSubtypeFilterKeys(filters, true)
              .should.eql([{id: 1, parent_type_id: 1}]);
          });
        });
        describe("getNotSpecifiedTypeFilterKeys", function () {
          it("can ignore string types", function () {
            var filters = [
              new Backbone.Model({id: -1, parent_type_id: 1}),
              new Backbone.Model({id: "r.ns", parent_type_id: "r"})
            ];
            FilterUrlSerialiser.getNotSpecifiedTypeFilterKeys(filters)
              .should.eql([{id: 1}, {id: "r.ns"}]);
            FilterUrlSerialiser.getNotSpecifiedTypeFilterKeys(filters, true)
              .should.eql([{id: 1}]);
          });
        });
        describe("getRoleFilterKeys", function () {
          it("gets only roles", function () {
            var filters = [
              new Backbone.Model({id: 1, parent_type_id: 1}),
              new Backbone.Model({id: "r1", parent_type_id: "r"})
            ];
            FilterUrlSerialiser.getRoleFilterKeys(filters, true)
              .should.eql([{id: 1, parent_type_id: "r"}]);
          });
        });
        describe("getEventTypeFilterKeys", function () {
          it("gets only event types", function () {
            var filters = [
              new Backbone.Model({id: 1, parent_type_id: 1}),
              new Backbone.Model({id: "et1", parent_type_id: "et"})
            ];
            FilterUrlSerialiser.getEventTypeFilterKeys(filters, true)
              .should.eql([{id: 1, parent_type_id: "et"}]);
          });
        });

      });

      it("should produce appropriate results when string contains a combination of everything", function () {
        FilterUrlSerialiser.deserialise("1:*;2:u;3:u,4;5:6,7;r:4;et:u,6", this.model);
        var json = JSON.stringify(this.model.get("filterState").toJSON());
        json.should.equal("[" + [
          "{\"id\":1}",
          "{\"id\":-2,\"parent_type_id\":2}",
          "{\"id\":-3,\"parent_type_id\":3}",
          "{\"id\":4,\"parent_type_id\":3}",
          "{\"id\":6,\"parent_type_id\":5}",
          "{\"id\":7,\"parent_type_id\":5}",
          "{\"id\":\"r4\",\"parent_type_id\":\"r\"}",
          "{\"id\":\"et.ns\",\"parent_type_id\":\"et\"}",
          "{\"id\":\"et6\",\"parent_type_id\":\"et\"}"
        ].join(",") + "]");

      });

    });

  }

);
