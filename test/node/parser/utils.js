/*global describe, before, after, beforeEach, afterEach, it */
var utils = require("../../../lib/parser/utils");

describe("utils", function () {

  describe("escapeQuote", function () {
    it("should replace a single quote with two quotes", function () {
      utils.escapeQuote("'").should.equal("''");
    });
    it("should replace a single quote with two quotes many times", function () {
      utils.escapeQuote("o'hara o'connell").should.equal("o''hara o''connell");
    });
  });

  describe("extractName", function () {
    it("should take the name out of last part of a URL", function () {
      utils.extractName("<http://blah.com/name>").should.equal("name");
    });
    it("should escape quotes", function () {
      utils.extractName("<http://blah.com/n'ame>").should.equal("n''ame");
    });
    it("should handle URL encoding", function () {
      utils.extractName("<http://blah.com/R%C3%A9mi>").should.equal("Rémi");
    });
    it("should handle underscores", function () {
      utils.extractName("<http://blah.com/john_smith>").should.equal("john smith");
    });
  });

  describe("tidyLine", function () {
    it("should remove spaces from within quotes", function () {
      utils.tidyLine("hey \"ho let's\" go").should.equal("hey \"ho_let's\" go");
    });
    it("should remove multiple spaces from within quotes", function () {
      utils.tidyLine("hey \"ho let's really\" go").should.equal("hey \"ho_let's_really\" go");
    });

    it("should remove spaces from multiple quotes", function () {
      utils.tidyLine("hey \"ho let's\" go \"somewhere better\" than this")
       .should.equal("hey \"ho_let's\" go \"somewhere_better\" than this");
    });
  });

  describe("unescapeUnicode", function () {
    it("should unescape strings with unescaped unicode in them", function () {
      utils.unescapeUnicode("Helene Kr\\u00F6ller-M\\u00FCller")
        .should.equal("Helene Kröller-Müller");
    });
  });

});