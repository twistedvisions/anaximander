/*global describe, it, before, beforeEach, afterEach */

var sinon = require("sinon");
var should = require("should");
var _ = require("underscore");

var tryTest = require("../tryTest");
var stubDb = require("../stubDb");

var editThing = require("../../../lib/rest/editThing");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("editThing", function () {
  before(function () {
    this.testEdit = function (fn, done, failureFn) {
      var req = {
        user: {id: 1, last_save_time: new Date(0)},
        body: this.fullBody,
        isAuthenticated: function () {
          return true;
        }
      };
      var res = {
        send: function () {}
      };
      var next = function (e) {
        return failureFn ? failureFn(e) : null;
      };
      this.thingEditor.call(req, res, next).then(tryTest(_.bind(fn, this), done));
      stubDb.setQueryValues(this, this.stubValues);
    };
  });
  beforeEach(function () {
    this.thingEditor = new editThing.ThingEditor();
    sinon.stub(this.thingEditor, "ensureSubtypeAndImportance");
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore(this);
    this.thingEditor.ensureSubtypeAndImportance.restore();
    this.thingEditor = null;
  });
  describe("component functions", function () {
    beforeEach(function () {
      this.stubValues = [];
      sinon.spy(this.thingEditor, "ensure");
      sinon.stub(this.thingEditor, "getThing", _.bind(function () {
        this.thingEditor.originalThing = this.originalThing;
      }, this));

      this.originalThing = {
        typeId: {
          id: 3
        },
        subtypes: [{type: {id: 6}}],
        last_edited: "1999-01-01"
      };
    });
    afterEach(function () {
      this.thingEditor.ensure.restore();
      this.thingEditor.getThing.restore();
      this.originalthing = null;
    });
    it("should throw an error if no id is passed", function (done) {
      this.fullBody = {};

      this.testEdit(function () {}, null, function (e) {
        should.exist(e);
        done();
      });
    });
    it("should throw an error if nothing is passed to change", function (done) {
      this.fullBody = {
        id: 1
      };

      this.testEdit(function () {}, null, function (e) {
        should.exist(e);
        done();
      });
    });
    //todo: this should live on the class editThing extends
    it("should fail if no last_edited time is passed", function (done) {
      this.fullBody = {
        id: 1,
        type: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}]
      ];

      this.testEdit(function () {
        throw new Error("should not get here");
      }, done, function () {
        done();
      });
    });
    it("should fail if the last_edited is different", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        type: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_thing_lock", last_edited: "2000-01-02"}]
      ];

      this.testEdit(function () {
        throw new Error("should not get here");
      }, done, function () {
        done();
      });
    });
    it("should ensure the thing type if it is passed", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        typeId: 2
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_type_by_id", id: 2}],
        [{db_call: "update_thing_type", id: 2}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.thingEditor.ensure.calledWith(sinon.match.any, "thing type").should.equal(true);
      }, done);
    });

    it("should save a changed name", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_thing_name"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("update_thing_name");
        this.args[2][2][1].should.equal("new name");
      }, done);
    });

    it("should save a changed link", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        link: "new link"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_thing_link"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("update_thing_link");
        this.args[2][2][1].should.equal("new link");
      }, done);
    });

    it("should save a changed thing type", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        typeId: 2
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_type_by_id", id: 2}],
        [{db_call: "update_thing_type"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("update_thing_type");
        this.args[3][2][1].should.eql(2);
      }, done);
    });


    it("should ensure that new subtypes exist", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        newSubtypes: [{type: {id: 1}, importance: {id: 1}}]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "save_thing_subtype"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.thingEditor.ensureSubtypeAndImportance.calledOnce.should.equal(true);
      }, done);
    });
    it("should add new subtypes", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        newSubtypes: [{type: {id: 1}, importance: {id: 1}}]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "save_thing_subtype"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("save_thing_subtype");
      }, done);
    });

    it("should not permit changes to subtypes that are not part of the thing", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        editedSubtypes: [{type: {id: 10}}]
      };

      this.originalthing = {
        type: {
          id: 3
        },
        subtypes: []
      };

      this.stubValues = [
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}]
      ];

      this.testEdit(function () {
        throw new Error("should not get here");
      }, done, function () {
        done();
      });
    });

    it("should ensure that changed subtypes' values exist", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        editedSubtypes: {2: {id: 7}}
      };

      this.originalThing = {
        type: {
          id: 3
        },
        subtypes: [{type: {id: 2}}]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.thingEditor.ensureSubtypeAndImportance.calledOnce.should.equal(true);
      }, done);
    });

    it("should change the importance of existing subtypes", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        editedSubtypes: {2: {id: 3}}
      };

      this.originalThing = {
        type: {
          id: 3
        },
        subtypes: [{type: {id: 2}}]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_thing_subtype_importance"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("update_thing_subtype_importance");
      }, done);
    });

    it("should remove exisiting subtypes", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        removedSubtypes: [1]
      };

      this.originalThing = {
        type: {
          id: 3
        },
        subtypes: [
          {type: {id: 1}}
        ]
      };

      this.stubValues = [

        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "remove_thing_subtype"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("remove_thing_subtype");
      }, done);
    });

    it("should not remove subtypes that do not exist", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        removedSubtypes: [1]
      };

      this.originalThing = {
        type: {
          id: 3
        },
        subtypes: []
      };

      this.stubValues = [
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}]
      ];

      this.testEdit(function () {
        throw new Error("should not get here");
      }, done, function () {
        done();
      });
    });

    it("should call save_change after a change has happened", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_thing_name"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_thing_change");
      }, done);
    });

    it("should not save the last_edited time in the thing change", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_thing_name"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_thing_change");
        should.not.exist(JSON.parse(this.args[3][2][3]).last_edited);
        should.not.exist(JSON.parse(this.args[3][2][4]).last_edited);

      }, done);
    });

    it("should not save unknown keys in the thing change", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name",
        funny: "business",
        newSubtypes: [{type: {id: 1}, importance: {id: 1}, funny: "business"}]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-thing"}],
        [{db_call: "get_thing_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_thing_name"}],
        [{db_call: "save_thing_subtype"}],
        [{db_call: "save_thing_change"}],
        [{db_call: "update_thing_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[4][1].should.equal("save_thing_change");
        should.not.exist(JSON.parse(this.args[4][2][4]).funny);
        should.not.exist(JSON.parse(this.args[4][2][4]).newSubtypes[0].funny);
      }, done);
    });

  });
});
