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

      it("should return <id>:* when only a primary", function () {
        this.model.get("filterState").set([{id: 1}], {remove: false});
        FilterUrlSerialiser.serialise(this.model).should.equal("1:*");
      });

      it("should return <id>:u when only an unspecified", function () {
        this.model.get("filterState").set([{id: -1, parent_type: 1}], {remove: false});
        FilterUrlSerialiser.serialise(this.model).should.equal("1:u");
      });

      it("should return <id>:<id> when only a secondary", function () {
        this.model.get("filterState").set([{id: 2, parent_type: 1}], {remove: false});
        FilterUrlSerialiser.serialise(this.model).should.equal("1:2");
      });

      it("should return <id>:u,<id> when an unspecified and a secondary", function () {
        this.model.get("filterState").set(
          [{id: -1, parent_type: 1}, {id: 2, parent_type: 1}], 
          {remove: false}
        );
        FilterUrlSerialiser.serialise(this.model).should.equal("1:u,2");
      });

      it("should return handle multiple primary filter keys", function () {
        this.model.get("filterState").set([{id: 1}, {id: 2}], {remove: false});
        FilterUrlSerialiser.serialise(this.model).should.equal("1:*;2:*");
      });

      it("should return handle a combination of everything", function () {
        this.model.get("filterState").set([
          {id: 1}, 
          {id: -2, parent_type: 2}, 
          {id: -3, parent_type: 3}, 
          {id: 4, parent_type: 3}, 
          {id: 6, parent_type: 5}, 
          {id: 7, parent_type: 5}
        ], {remove: false});
        FilterUrlSerialiser.serialise(this.model).should.equal("1:*;2:u;3:u,4;5:6,7");
      });

    });

    describe("deserialisation", function () {

      it("should product an empty object when deserialising an empty string", function () {
        FilterUrlSerialiser.deserialise("", this.model).get("filterState").length.should.equal(0);
      });

      it("should produce a primary when string is <id>:*", function () {
        FilterUrlSerialiser.deserialise("1:*", this.model);
        var json = JSON.stringify(this.model.get("filterState").toJSON());
        json.should.equal("[{\"id\":1}]");
      });
  
      it("should produce a not specified filter when string is <id>:u", function () {
        FilterUrlSerialiser.deserialise("1:u", this.model);
        var json = JSON.stringify(this.model.get("filterState").toJSON());
        json.should.equal("[{\"id\":-1,\"parent_type\":1}]");
      });

      it("should produce a secondary when string is <id>:<id>", function () {
        FilterUrlSerialiser.deserialise("1:2", this.model);
        var json = JSON.stringify(this.model.get("filterState").toJSON());
        json.should.equal("[{\"id\":2,\"parent_type\":1}]");
      });

      it("should produce an unspecified and a secondary when string is <id>:u,<id>", function () {
        FilterUrlSerialiser.deserialise("1:u,2", this.model);
        var json = JSON.stringify(this.model.get("filterState").toJSON());
        json.should.equal("[{\"id\":-1,\"parent_type\":1},{\"id\":2,\"parent_type\":1}]");
      });

      it("should produce multiple primary filter keys", function () {
        FilterUrlSerialiser.deserialise("1:*;2:*", this.model);
        var json = JSON.stringify(this.model.get("filterState").toJSON());
        json.should.equal("[{\"id\":1},{\"id\":2}]");
      });

      it("should produce appropriate results when string contains a combination of everything", function () {
        FilterUrlSerialiser.deserialise("1:*;2:u;3:u,4;5:6,7", this.model);
        var json = JSON.stringify(this.model.get("filterState").toJSON());
        json.should.equal("[" + [
          "{\"id\":1}", 
          "{\"id\":-2,\"parent_type\":2}", 
          "{\"id\":-3,\"parent_type\":3}", 
          "{\"id\":4,\"parent_type\":3}", 
          "{\"id\":6,\"parent_type\":5}", 
          "{\"id\":7,\"parent_type\":5}",
        ].join(",") + "]");

      });

    });

  }

);
