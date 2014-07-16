/*global describe, it, beforeEach, afterEach */

var sinon = require("sinon");
var should = require("should");
var _ = require("underscore");
var when = require("when");
var moment = require("moment");

var tryTest = require("../../tryTest");
var stubDb = require("../../stubDb");

var EventUtils = require("../../../../lib/rest/util/EventUtils");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("EventUtils", function () {

  beforeEach(function () {
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore(this);
  });

  describe("addAttendees", function () {
    it("should add each attendee to the event", function (done) {
      var self = this;
      new EventUtils().addParticipants(1, [
          {thing: {id: 3}, type: {id: 4}, importance: {id: 5}},
          {thing: {id: 6}, type: {id: 7}, importance: {id: 8}}
        ], 9).then(
        tryTest(function () {
          self.args[1][1].should.equal("save_event_participant");
          self.args[2][1].should.equal("save_event_participant");
        }, done),
        function (e) {
          done(e);
        }
      );
      stubDb.setQueryValues(this, [
        [{id: 1}],
        [{id: 2}],
        [{id: 3}]
      ]);
    });
    it("should add a creator if necessary", function (done) {
      var self = this;
      new EventUtils().addParticipants(1, [
          {thing: {id: 3}, type: {id: 4}, importance: {id: 5}},
          {thing: {id: 6}, type: {id: 7}, importance: {id: 8}}
        ], 9).then(
        tryTest(function () {
          self.args[0][1].should.equal("save_creator");
        }, done),
        function (e) {
          done(e);
        }
      );
      stubDb.setQueryValues(this, [
        [{id: 1}],
        [{id: 2}],
        [{id: 3}]
      ]);
    });
  });

  describe("ensureParticipantTypesAndImportances", function () {
    beforeEach(function () {
      this.eventUtils = new EventUtils();
      this.eventUtils.permissions = {
        "add-type": {},
        "add-importance": {}
      };
    });
    describe("roles", function () {

      it("should save new roles that exist once", function (done) {
        this.participants = [{
          thing: {id: 1},
          type: {name: "new role"},
          importance: {name: "nominal", description: "description", value: 5}
        }];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].type.id.should.equal(2);
            this.participants[0].importance.id.should.equal(3);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_role", id: 2}],
          [{db_call: "save_importance", id: 3}],
          [{db_call: "update_type_default_importance_when_null"}],
        ]);
      });
      it("should save new roles that exist in multiple participants", function (done) {
        this.participants = [
          {
            thing: {id: 1},
            type: {name: "new role"},
            importance: {name: "nominal", description: "description", value: 5}
          },
          {
            thing: {id: 2},
            type: {name: "new role"},
            importance: {name: "nominal", description: "description", value: 5}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].type.id.should.equal(2);
            this.participants[0].importance.id.should.equal(3);
            this.participants[1].type.id.should.equal(2);
            this.participants[1].importance.id.should.equal(3);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_role", id: 2}],
          [{db_call: "save_importance", id: 3}],
          [{db_call: "update_type_default_importance_when_null"}]
        ]);
      });
      it("should ensure existing roles and importances", function (done) {
        this.participants = [{
          thing: {id: 1},
          type: {id: 2, related_type_id: 101},
          importance: {id: 3}
        }];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].type.id.should.equal(2);
            this.participants[0].importance.id.should.equal(3);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 3}]
        ]);
      });
      it("should only ensure roles and importances that exist in multiple participants once", function (done) {
        this.participants = [{
          thing: {id: 1},
          type: {id: 2, related_type_id: 101},
          importance: {id: 3}
        }, {
          thing: {id: 2},
          type: {id: 2, related_type_id: 101},
          importance: {id: 3}
        }];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].type.id.should.equal(2);
            this.participants[0].importance.id.should.equal(3);
            this.participants[1].type.id.should.equal(2);
            this.participants[1].importance.id.should.equal(3);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 3}]
        ]);
      });
      it("should save new importances that exist once", function (done) {
        this.participants = [
          {
            thing: {id: 1},
            type: {id: 100, related_type_id: 101},
            importance: {name: "new importance", description: "description", value: 5}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(tryTest(_.bind(function () {
          this.participants[0].importance.id.should.equal(3);
        }, this), done));
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 100}],
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_importance", id: 3}]
        ]);
      });
      it("should save new importances that exist in multiple participants", function (done) {
        this.participants = [
          {
            thing: {id: 1},
            type: {id: 100, related_type_id: 101},
            importance: {name: "new importance", description: "description", value: 5}
          },
          {
            thing: {id: 2},
            type: {id: 100, related_type_id: 101},
            importance: {name: "new importance", description: "description", value: 5}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].importance.id.should.equal(3);
            this.participants[1].importance.id.should.equal(3);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 100}],
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_importance", id: 3}]
        ]);
      });
      it("should create and make default for the type a nominal importance, if no nominal importance is passed", function (done) {
        this.participants = [{
          thing: {id: 1},
          type: {name: "new role"},
          importance: {name: "new importance", description: "description", value: 5}
        }];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.args[3][1].should.equal("save_importance");
            this.args[3][2][1].should.equal("nominal");
            this.args[4][1].should.equal("update_type_default_importance_when_null");
            this.args[4][2].should.eql([2, 4]);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_role", id: 2}],
          [{db_call: "save_importance", id: 3}],
          [{db_call: "save_importance", id: 4}],
          [{db_call: "update_type_default_importance_when_null"}],
        ]);
      });
      it("should save the nominal importance as the default for the type if it is passed", function (done) {
        this.participants = [{
          thing: {id: 1},
          type: {name: "new role"},
          importance: {name: "nominal", description: "description", value: 5}
        }];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.args[2][1].should.equal("save_importance");
            this.args[2][2][1].should.equal("nominal");
            this.args[3][1].should.equal("update_type_default_importance_when_null");
            this.args[3][2].should.eql([2, 3]);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_role", id: 2}],
          [{db_call: "save_importance", id: 3}],
          [{db_call: "update_type_default_importance_when_null"}],
        ]);
      });
      it("should save one nominal importance if many non-nominal importances are saved for a new type", function (done) {
        this.participants = [
          {
            thing: {id: 1},
            type: {name: "new role"},
            importance: {name: "importance 1", description: "description", value: 5}
          },
          {
            thing: {id: 2},
            type: {name: "new role"},
            importance: {name: "importance 2", description: "description", value: 5}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].type.id.should.equal(2);
            this.participants[0].importance.id.should.equal(3);
            this.participants[1].type.id.should.equal(2);
            this.participants[1].importance.id.should.equal(4);
            this.args[5][2].should.eql([2, 5]);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_role", id: 2}],
          [{db_call: "save_importance", id: 3}],
          [{db_call: "save_importance", id: 4}],
          [{db_call: "save_importance", id: 5}],
          [{db_call: "update_type_default_importance_when_null"}]
        ]);
      });
      it("should save a nominal importance if many non-nominal and a nominal importance is saved for a new type", function (done) {
        this.participants = [
          {
            thing: {id: 1},
            type: {name: "new role"},
            importance: {name: "importance 1", description: "description", value: 5}
          },
          {
            thing: {id: 2},
            type: {name: "new role"},
            importance: {name: "nominal", description: "description", value: 5}
          },
          {
            thing: {id: 3},
            type: {name: "new role"},
            importance: {name: "importance 2", description: "description", value: 5}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].type.id.should.equal(2);
            this.participants[1].type.id.should.equal(2);
            this.participants[2].type.id.should.equal(2);
            this.participants[0].importance.id.should.equal(3);
            this.participants[1].importance.id.should.equal(4);
            this.participants[2].importance.id.should.equal(5);
            this.args[5][2].should.eql([2, 4]);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_role", id: 2}],
          [{db_call: "save_importance", id: 3}],
          [{db_call: "save_importance", id: 4}],
          [{db_call: "save_importance", id: 5}],
          [{db_call: "update_type_default_importance_when_null"}]
        ]);
      });
    });
    describe("subtypes", function () {
      it("should save new subtypes that exist once", function (done) {
        this.participants = [{
          thing: {name: "new thing", typeId: 1, subtypes: [{
            type: {name: "new type"},
            importance: {name: "new importance", description: "description", value: 5}
          }]},
          type: {id: 2, related_type_id: 100},
          importance: {id: 3}
        }];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].thing.subtypes[0].type.id.should.equal(4);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 3}],
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_subtype", id: 4}],
          [{db_call: "save_importance", id: 5}],
          [{db_call: "save_importance", id: 6}],
          [{db_call: "update_type_default_importance_when_null", id: 7}]
        ]);
      });
      it("should save new subtypes that exist multiple times", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {name: "new type"},
                importance: {name: "new importance1", description: "description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          },
          {
            thing: {name: "new thing2", typeId: 1, subtypes: [
              {
                type: {name: "new type"},
                importance: {name: "new importance1", description: "description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].thing.subtypes[0].type.id.should.equal(4);
            this.participants[1].thing.subtypes[0].type.id.should.equal(4);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 3}],
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_subtype", id: 4}],
          [{db_call: "save_importance", id: 5}],
          [{db_call: "save_importance", id: 6}],
          [{db_call: "update_type_default_importance_when_null", id: 7}]
        ]);
      });
      it("should save multiple new subtypes that have the same name, but existing in different thing types", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {name: "new type"},
                importance: {name: "new importance1", description: "description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          },
          {
            thing: {name: "new thing2", typeId: 1, subtypes: [
              {
                type: {name: "new type"},
                importance: {name: "new importance1", description: "description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].thing.subtypes[0].type.id.should.equal(4);
            this.participants[1].thing.subtypes[0].type.id.should.equal(4);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 3}],
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_subtype", id: 4}],
          [{db_call: "save_importance", id: 5}],
          [{db_call: "save_importance", id: 6}],
          [{db_call: "update_type_default_importance_when_null", id: 7}]
        ]);
      });
      it("should save new subtype importances that exist once", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {id: 4},
                importance: {name: "new importance1", description: "description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          tryTest(_.bind(function () {
            this.participants[0].thing.subtypes[0].importance.id.should.equal(5);
          }, this), done)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 3}],
          [{db_call: "find_type_by_id", id: 4}],
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_importance", id: 5}]
        ]);
      });
      it("should save new subtype importances that multiple times", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {id: 4},
                importance: {name: "new importance1", description: "description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          },
          {
            thing: {name: "new thing2", typeId: 1, subtypes: [
              {
                type: {id: 4},
                importance: {name: "new importance1", description: "description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].thing.subtypes[0].importance.id.should.equal(5);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 3}],
          [{db_call: "find_type_by_id", id: 4}],
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_importance", id: 5}]
        ]);
      });

      it("should ensure existing subtypes that exist once", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {id: 4},
                importance: {id: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].thing.subtypes[0].type.id.should.equal(4);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 3}],
          [{db_call: "find_type_by_id", id: 4}],
          [{db_call: "find_importance_by_id", id: 5}]
        ]);
      });
      it("should ensure existing subtypes that exist multiple times", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {id: 4},
                importance: {id: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          },
          {
            thing: {name: "new thing2", typeId: 1, subtypes: [
              {
                type: {id: 4},
                importance: {id: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].thing.subtypes[0].type.id.should.equal(4);
            this.participants[1].thing.subtypes[0].type.id.should.equal(4);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 3}],
          [{db_call: "find_type_by_id", id: 4}],
          [{db_call: "find_importance_by_id", id: 5}]
        ]);
      });
      it("should ensure existing subtype importances that exist once", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {id: 4},
                importance: {id: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].thing.subtypes[0].importance.id.should.equal(5);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 3}],
          [{db_call: "find_type_by_id", id: 4}],
          [{db_call: "find_importance_by_id", id: 5}]
        ]);
      });
      it("should ensure existing subtype importances that multiple times", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {id: 4},
                importance: {id: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          },
          {
            thing: {name: "new thing2", typeId: 1, subtypes: [
              {
                type: {id: 4},
                importance: {id: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.participants[0].thing.subtypes[0].importance.id.should.equal(5);
            this.participants[1].thing.subtypes[0].importance.id.should.equal(5);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_type_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 3}],
          [{db_call: "find_type_by_id", id: 4}],
          [{db_call: "find_importance_by_id", id: 5}]
        ]);
      });

      it("should create and make default for a new type a nominal importance, if no nominal importance is passed", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {name: "new type"},
                importance: {name: "new importance", description: "importance description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.args[5][1].should.equal("save_importance");
            this.args[5][2][1].should.equal("nominal");
            this.args[6][1].should.equal("update_type_default_importance_when_null");
            this.args[6][2].should.eql([5, 7]);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_role_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 4}],
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_subtype", id: 5}],
          [{db_call: "save_importance", id: 6}],
          [{db_call: "save_importance", id: 7}],
          [{db_call: "update_type_default_importance_when_null"}],
        ]);
      });
      it("should save the nominal importance as the default for the type if it is passed", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {name: "new type"},
                importance: {name: "nominal", description: "importance description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          _.bind(function () {
            this.args[4][1].should.equal("save_importance");
            this.args[4][2][1].should.equal("nominal");
            this.args[5][1].should.equal("update_type_default_importance_when_null");
            this.args[5][2].should.eql([5, 6]);
            done();
          }, this)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_role_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 4}],
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_subtype", id: 5}],
          [{db_call: "save_importance", id: 6}],
          [{db_call: "update_type_default_importance_when_null"}],
        ]);
      });
      it("should save one nominal importance if many non-nominal importances are saved for a new type", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {name: "new type"},
                importance: {name: "not nominal1", description: "importance description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          },
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {name: "new type"},
                importance: {name: "not nominal2", description: "importance description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          tryTest(_.bind(function () {
            this.args[6][1].should.equal("save_importance");
            this.args[6][2][1].should.equal("nominal");
            this.args[7][1].should.equal("update_type_default_importance_when_null");
            this.args[7][2].should.eql([5, 8]);
          }, this), done)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_role_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 4}],
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_subtype", id: 5}],
          [{db_call: "save_importance", id: 6}],
          [{db_call: "save_importance", id: 7}],
          [{db_call: "save_importance", id: 8}],
          [{db_call: "update_type_default_importance_when_null"}],
        ]);
      });
      it("should save a nominal importance if many non-nominal and a nominal importance is saved for a new type", function (done) {
        this.participants = [
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {name: "new type"},
                importance: {name: "not nominal1", description: "importance description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          },
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {name: "new type"},
                importance: {name: "nominal", description: "importance description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          },
          {
            thing: {name: "new thing1", typeId: 1, subtypes: [
              {
                type: {name: "new type"},
                importance: {name: "not nominal2", description: "importance description", value: 5}
              }
            ]},
            type: {id: 2, related_type_id: 100},
            importance: {id: 3}
          }
        ];
        this.eventUtils.ensureParticipantTypesAndImportances(
          this.participants, 321
        ).then(
          tryTest(_.bind(function () {
            this.args[5][1].should.equal("save_importance");
            this.args[5][2][1].should.equal("nominal");
            this.args[7][1].should.equal("update_type_default_importance_when_null");
            this.args[7][2].should.eql([5, 7]);
          }, this), done)
        );
        stubDb.setQueryValues(this, [
          [{db_call: "find_role_by_id", id: 2}],
          [{db_call: "find_importance_by_id", id: 4}],
          [{db_call: "save_creator", id: 1}],
          [{db_call: "save_subtype", id: 5}],
          [{db_call: "save_importance", id: 6}],
          [{db_call: "save_importance", id: 7}],
          [{db_call: "save_importance", id: 8}],
          [{db_call: "update_type_default_importance_when_null"}],
        ]);
      });
    });
  });

  describe("ensureParticipant", function () {
    beforeEach(function () {
      this.eventUtils = new EventUtils();
      sinon.stub(this.eventUtils, "ensure", function () {
        return when.resolve();
      });
    });
    describe("new participants", function () {
      it("should throw an exception if it isn't passed a thing", function () {
        var ex;
        try {
          this.eventUtils.ensureParticipant({
            type: {id: 1},
            importance: {id: 2}
          });
        }
        catch (e) {
          ex = e;
        }
        should.exist(ex);
      });
      it("should throw an exception if it isn't passed a type", function () {
        var ex;
        try {
          this.eventUtils.ensureParticipant({
            thing: {id: 1},
            importance: {id: 2}
          });
        }
        catch (e) {
          ex = e;
        }
        should.exist(ex);
      });

      it("should throw an exception if it isn't passed a importance", function () {
        var ex;
        try {
          this.eventUtils.ensureParticipant({
            type: {id: 1},
            thing: {id: 2}
          });
        }
        catch (e) {
          ex = e;
        }
        should.exist(ex);
      });
      describe("existing things", function () {
        it("should ensure participant things", function (done) {
          this.eventUtils.ensureParticipant({
            thing: {id: 1},
            type: {id: 2},
            importance: {id: 3}
          }).then(
            tryTest(_.bind(function () {
              this.eventUtils.ensure.calledWith(sinon.match.any, "participant thing").should.equal(true);
            }, this), done)
          );
          stubDb.setQueryValues(this, [[]]);
        });
      });
      describe("new things", function () {
        beforeEach(function () {
          this.participant = {
            thing: {
              id: -1,
              name: "new thing",
              typeId: 1,
              subtypes: [
                {
                  type: {id: 4},
                  importance: {id: 5}
                }
              ]
            },
            type: {id: 2},
            importance: {id: 3}
          };
        });
        it("should create new participants things", function (done) {
          this.eventUtils.ensureParticipant(this.participant).then(
            tryTest(_.bind(function () {
              this.eventUtils.ensure.calledWith(sinon.match.any, "participant thing").should.equal(true);
              this.eventUtils.ensure.args[0][6].should.eql(["add-thing"]);
            }, this), done)
          );
          stubDb.setQueryValues(this, [[]]);
        });
        it("should add subtypes to the new thing", function (done) {
          this.eventUtils.ensureParticipant(this.participant).then(
            tryTest(_.bind(function () {
              this.args[0][1].should.equal("save_thing_subtype");
            }, this), done)
          );
          stubDb.setQueryValues(this, [[]]);
        });
      });
    });
    describe("changing participants", function () {
      it("should ensure at least one of types and importances exist", function () {
        var ex;
        try {
          this.eventUtils.ensureParticipant({
            thing: {id: 1},
            type: {id: 2}
          }, true);
        }
        catch (e) {
          ex = e;
        }
        should.not.exist(ex);

        try {
          this.eventUtils.ensureParticipant({
            thing: {id: 1}
          }, true);
        }
        catch (e) {
          ex = e;
        }
        should.exist(ex);
      });
      it("should ensure that the thing exists in the event", function (done) {
        this.eventUtils.ensureParticipant({
          thing: {id: 1},
          type: {id: 2},
          importance: {id: 3}
        }, true).then(
          tryTest(_.bind(function () {
            this.eventUtils.ensure.calledWith(sinon.match.any, "participant thing").should.equal(true);
          }, this), done)
        );
        stubDb.setQueryValues(this, [[]]);
      });
    });
  });

  describe("setTimezoneOffset", function () {
    it("should adjust the start date, by the timezone offset at the place", function (done) {
      var params = {
        start_date: "2013-06-02T00:00:00Z",
        end_date: "2013-06-02T00:00:00Z",
        placeId: 1
      };
      new EventUtils().setTimezoneOffset(params).then(
        tryTest(_.bind(function () {
          params.start_date.toDate().should.eql(moment("2013-06-02T01:00:00Z").toDate());
        }, this), done),
        done
      );
      stubDb.setQueryValues(this, [
        [{offset: -3600}]
      ]);
    });
    it("should adjust the end date, by the timezone offset at the place", function (done) {
      var params = {
        start_date: "2013-06-02T00:00:00Z",
        end_date: "2013-06-02T00:00:00Z",
        placeId: 1
      };
      new EventUtils().setTimezoneOffset(params).then(
        tryTest(_.bind(function () {
          params.end_date.toDate().should.eql(moment("2013-06-02T01:00:00Z").toDate());
        }, this), done),
        done
      );
      stubDb.setQueryValues(this, [
        [{offset: -3600}]
      ]);
    });
    it("should not permit the start year to be 0", function (done) {
      var params = {
        start_date: "0000-06-02T00:00:00Z",
        end_date: "2013-06-02T00:00:00Z",
        placeId: 1
      };
      new EventUtils().setTimezoneOffset(params).then(
        tryTest(_.bind(function () {
          params.start_date.get("year").should.eql(-1);
        }, this), done),
        done
      );
      stubDb.setQueryValues(this, [
        [{offset: -3600}]
      ]);
    });
    it("should not permit the end year to be 0", function (done) {
      var params = {
        start_date: "-000001-06-02T00:00:00Z",
        end_date: "0000-06-02T00:00:00Z",
        placeId: 1
      };
      new EventUtils().setTimezoneOffset(params).then(
        tryTest(_.bind(function () {
          params.end_date.get("year").should.eql(-1);
        }, this), done),
        done
      );
      stubDb.setQueryValues(this, [
        [{offset: -3600}]
      ]);
    });
  });
});
