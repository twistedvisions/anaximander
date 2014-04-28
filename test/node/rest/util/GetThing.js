/*global describe, it */
var getThing = require("../../../../lib/rest/util/GetThing");

describe("getThing", function () {
  it("should format subtypes", function () {
    var thing = getThing.handleGetThing([
      {
        id: 1,
        name: "joe bloggs",
        link: "http://joe.com/blogs",
        type_id: 321,
        thing_type_id: 88,
        importance_id: 43
      },
      {
        id: 1,
        name: "joe bloggs",
        link: "http://joe.com/blogs",
        type_id: 321,
        thing_type_id: 89,
        importance_id: 44
      }
    ]);
    thing.subtypes.length.should.equal(2);
    thing.subtypes[0].type.id.should.equal(88);
    thing.subtypes[0].importance.id.should.equal(43);
    thing.subtypes[1].type.id.should.equal(89);
    thing.subtypes[1].importance.id.should.equal(44);
  });
});