/*global describe, it */
var getEvents = require("../../../lib/rest/getEvents");
var should = require("should");

describe("getEvents", function () {
  describe("filters", function () {
    /*

    Reference data:

    thing_id thing_type thing_subtype
       1         1           2
       1         1           3
       2         1           2
       3         1           3
       4         1          NULL
       5         2           4
       5         2           5
       6         2           4
       7         2           5
       8         2          NULL

    */

    /*

      [X] Primary1 (1)
      [X] Primary2 (2)
      [X] Not specified (-1)
      [X] Secondary2 (2)
      [X] Secondary3 (3)

    no filters
    => thing_id 1,2,3,4,5,6,7,8
    */

    it("should generate nothing when no filters", function () {
      getEvents.generateEventFilters({
        typeFilters: [],
        subtypeFilters: [],
        notSpecifiedTypeFilters: []
      }).should.equal("");
    });
    /*

      [ ] Primary1 (1)
      [X] Primary2 (2)
      [ ] Not specified (-1)
      [ ] Secondary2 (2)
      [ ] Secondary3 (3)

    => thing_id 5,6,7,8

    */
    it("should filter out a single primary", function () {
      getEvents.generateEventFilters({
        typeFilters: [{id: 1}],
        subtypeFilters: [],
        notSpecifiedTypeFilters: []
      }).should.equal("and ((thing.type_id not in (1)))");
    });

    it("should filter out a multiple primaries", function () {
      getEvents.generateEventFilters({
        typeFilters: [{id: 1}, {id: 2}],
        subtypeFilters: [],
        notSpecifiedTypeFilters: []
      }).should.equal("and ((thing.type_id not in (1, 2)))");
    });

    /*
      [.] Primary1 (1)
      [X] Primary2 (2)
      [X] Not specified (-1)
      [ ] Secondary2 (2)
      [ ] Secondary3 (3)

    => thing_id 4,5,6,7,8
    */
    it("should allow you to view only values that have no specified secondary", function () {
      getEvents.generateEventFilters({
        typeFilters: [],
        subtypeFilters: [{id: 2, parent_type: 1}, {id: 3, parent_type: 1}],
        notSpecifiedTypeFilters: []
      }).should.equal(
        "and ((((thing.type_id = 1) and ((thing_subtype.thing_type_id not in (2, 3)) or (thing_subtype.thing_type_id is null))) " +
        "or (thing.type_id not in (1))))");
    });

    /*

      [.] Primary1 (1)
      [X] Primary2 (2)
      [ ] Not specified (-1)
      [X] Secondary2 (2)
      [ ] Secondary3 (3)

    => thing_id 1,2,5,6,7,8

    */
    it("should allow you to specify only a single secondary", function () {
      getEvents.generateEventFilters({
        typeFilters: [],
        subtypeFilters: [{id: 3, parent_type: 1}],
        notSpecifiedTypeFilters: [{id: 1}]
      }).should.equal(
        "and ((((thing.type_id = 1) and ((thing_subtype.thing_type_id not in (3)))) " +
        "or (thing.type_id not in (1))))");
    });

    /*
      [.] Primary1 (1)
      [X] Primary2 (2)
      [X] Not specified (-1)
      [X] Secondary2 (2)
      [ ] Secondary3 (3)

    => thing_id 1,2,5,6,7,8
    */
    it("should allow you to specify a secondary and not specifieds", function () {
      getEvents.generateEventFilters({
        typeFilters: [],
        subtypeFilters: [{id: 3, parent_type: 1}],
        notSpecifiedTypeFilters: []
      }).should.equal(
        "and ((((thing.type_id = 1) and ((thing_subtype.thing_type_id not in (3)) or " +
        "(thing_subtype.thing_type_id is null))) " +
        "or (thing.type_id not in (1))))");
    });

    /*

      [.] Primary1 (1)
      [X] Primary2 (2)
      [ ] Not specified (-1)
      [X] Secondary2 (2)
      [X] Secondary3 (3)

    where (thing_type = 1 and thing_subtype is not null)
    or (thing_type not in (1))
    => thing_id 1,2,3,5,6,7,8
    */
    it("should allow you to specify everything that isn't unspecified", function () {
      getEvents.generateEventFilters({
        typeFilters: [],
        subtypeFilters: [],
        notSpecifiedTypeFilters: [{id: 1}]
      }).should.equal(
        "and ((((thing.type_id = 1) and (thing_subtype.thing_type_id is not null)) " +
        "or (thing.type_id not in (1))))");
    });

    /*

      [.] Primary1 (1)
      [ ] Primary2 (2)
      [ ] Not specified (-1)
      [X] Secondary2 (2)
      [ ] Secondary3 (3)

    => thing_id 1, 2
    */

    it("should allow you to specify both types and subtypes of a different type", function () {
      getEvents.generateEventFilters({
        typeFilters: [{id: 2}],
        subtypeFilters: [{id: 3, parent_type: 1}],
        notSpecifiedTypeFilters: [{id: 1}]
      }).should.equal(
        "and (" +
          "(thing.type_id not in (2)) and " +
          "((" + "(thing.type_id = 1) and " +
                      "((thing_subtype.thing_type_id not in (3)))" +
                ") or " +
                "(thing.type_id not in (1)))" +
        ")"
      );
    });


    /*

      [.] Primary1 (1)
      [ ] Primary2 (2)
      [ ] Not specified (-1)
      [X] Secondary2 (2)
      [X] Secondary3 (3)

     => thing_id 1,2,3
    */
    it("should allow you to filter out a whole type and unspecifieds of another type", function () {
      getEvents.generateEventFilters({
        typeFilters: [{id: 2}],
        subtypeFilters: [],
        notSpecifiedTypeFilters: [{id: 1}]
      }).should.equal(
        "and ((thing.type_id not in (2)) and (((thing.type_id = 1) and (thing_subtype.thing_type_id is not null)) " +
        "or (thing.type_id not in (1))))");
    });


    /*

      [.] Primary1 (1)
      [ ] Primary2 (2)
      [X] Not specified (-1)
      [X] Secondary2 (2)
      [ ] Secondary3 (3)

    => thing_id 1, 2, 4
    */

    it("should allow you to filter out a whole type and a single other subtype", function () {
      getEvents.generateEventFilters({
        typeFilters: [{id: 2}],
        subtypeFilters: [{id: 3, parent_type: 1}],
        notSpecifiedTypeFilters: []
      }).should.equal(
        "and (" +
          "(thing.type_id not in (2)) and " +
          "((" + "(thing.type_id = 1) and " +
                      "(" +
                        "(thing_subtype.thing_type_id not in (3)) or " +
                        "(thing_subtype.thing_type_id is null)" +
                      ")" +
                 ") or " +
                 "(thing.type_id not in (1)))" +
        ")"
      );
    });


    /*

      [.] Primary1 (1)
      [ ] Primary2 (2)
      [ ] Not specified (-1)
      [X] Secondary2 (2)
      [X] Secondary3 (3)

    => thing_id 4
    */

    it("should allow you to filter out a whole type and only unspecifieds of another type", function () {

      getEvents.generateEventFilters({
        typeFilters: [{id: 2}],
        subtypeFilters: [],
        notSpecifiedTypeFilters: [{id: 1}]
      }).should.equal(
        "and (" +
          "(thing.type_id not in (2)) and " +
          "(" +
            "(" + "(thing.type_id = 1) and " +
                  "(thing_subtype.thing_type_id is not null)" +
            ") or " +
            "(thing.type_id not in (1))" +
          ")" +
        ")"
      );
    });


    /*

      [.] Primary1 (1)
      [.] Primary2 (2)
      [X] Not specified (-1)
      [ ] Secondary2 (2)
      [X] Secondary3 (3)
      [ ] Secondary4 (4)
      [X] Secondary5 (5)

    => thing_id 1,2,5,6
    */

    it("should allow you to filter in only two subtypes of different types", function () {

      var query = getEvents.generateEventFilters({
        typeFilters: [],
        subtypeFilters: [{id: 2, parent_type: 1}, {id: 4, parent_type: 2}],
        notSpecifiedTypeFilters: []
      });

      var both = query.replace(/[^\()]/g, "");
      var closes = query.replace(/[^\)]/g, "");
      var diff = (both.length - closes.length);
      diff.should.equal(closes.length);

      query.should.equal(
        "and ((" +
              "(" + "(thing.type_id = 1) and " +
                    "(" +
                          "(thing_subtype.thing_type_id not in (2))" +
                          " or (thing_subtype.thing_type_id is null)" +
                    ")" +
              ") " +
              "or " +
              "(" + "(thing.type_id = 2) and " +
                    "(" +
                          "(thing_subtype.thing_type_id not in (4))" +
                          " or (thing_subtype.thing_type_id is null)" +
                    ")" +
              ") " +
               "or " +
              "(thing.type_id not in (1, 2))" +
            "))"
      );
    });

    /*

      [.] Primary1 (1)
      [.] Primary2 (2)
      [ ] Not specified (-1)
      [X] Secondary2 (2)
      [X] Secondary3 (3)
      [ ] Secondary4 (4)
      [X] Secondary5 (5)

    where (thing.type_id not in (2) or (thing_type = 1 and thing_subtype is null))
    => thing_id 4
    */

    it("should allow you to filter out a subtype and only the unspecifieds of another type", function () {

      var query = getEvents.generateEventFilters({
        typeFilters: [],
        subtypeFilters: [{id: 4, parent_type: 2}],
        notSpecifiedTypeFilters: [{id: 1}]
      });

      query.should.equal(
        "and (" +
              "(" +
                "(" +
                  "(" + "(thing.type_id = 2) and " +
                        "(" +
                              "(thing_subtype.thing_type_id not in (4))" +
                              " or (thing_subtype.thing_type_id is null)" +
                        ")" +
                  ") " +
                  "or (thing.type_id not in (2))" +
                ")" +
              ") " +
              "and " +
              "(" +
                "(" +
                  "(thing.type_id = 1) and " +
                  "(thing_subtype.thing_type_id is not null)" +
                ") " +
                "or (thing.type_id not in (1))" +
              ")" +
            ")"
      );
    });

    it("should allow you to filter out roles", function () {
      var query = getEvents.generateEventFilters({
        roleFilters: [1, 2],
        typeFilters: [],
        subtypeFilters: [],
        notSpecifiedTypeFilters: []
      });
      query.should.equal("and ((event_participant.role_id not in (1, 2)))");
    });

    it("should allow you to filter out event types", function () {
      var query = getEvents.generateEventFilters({
        eventTypeFilters: [1, 2],
        typeFilters: [],
        subtypeFilters: [],
        notSpecifiedTypeFilters: []
      });
      query.should.equal("and ((event.type_id not in (1, 2)))");
    });

    describe("invalid data", function () {
      it("should fail with bad eventTypes", function () {
        var e;
        try {
          getEvents.generateEventFilters({
            eventTypeFilters: [1, 2, "3 -- bobby tables"],
            typeFilters: [],
            subtypeFilters: [],
            notSpecifiedTypeFilters: []
          });
        } catch (_e) {
          e = _e;
        }
        should.exist(e);
      });
      it("should fail with bad roles", function () {
        var e;
        try {
          getEvents.generateEventFilters({
            roleFilters: [1, 2, "3 -- bobby tables"],
            typeFilters: [],
            subtypeFilters: [],
            notSpecifiedTypeFilters: []
          });
        } catch (_e) {
          e = _e;
        }
        should.exist(e);
      });
      it("should fail with bad types", function () {
        var e;
        try {
          getEvents.generateEventFilters({
            typeFilters: [{id: 2}, {id: "3 -- bobby tables"}],
            subtypeFilters: [],
            notSpecifiedTypeFilters: []
          });
        } catch (_e) {
          e = _e;
        }
        should.exist(e);
      });
      it("should fail with bad subtypes", function () {
        var e;
        try {
          getEvents.generateEventFilters({
            typeFilters: [{id: 2}],
            subtypeFilters: [{id: 4, parent_type: 2}, {id: "4 -- bobby tables", parent_type: 2}],
            notSpecifiedTypeFilters: []
          });
        } catch (_e) {
          e = _e;
        }
        should.exist(e);
      });
      it("should fail with bad not-specified types", function () {
        var e;
        try {
          getEvents.generateEventFilters({
            typeFilters: [{id: 2}],
            subtypeFilters: [{id: 4, parent_type: 2}],
            notSpecifiedTypeFilters: [{id: 1}, {id: "2 -- bobby tables"}]
          });
        } catch (_e) {
          e = _e;
        }
        should.exist(e);
      });
    });

  });
});