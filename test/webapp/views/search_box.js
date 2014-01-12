/*global describe, it */
/*jshint expr: true*/
define(
  ["views/search_box"],
  function (SearchBox) {

    describe("interaction", function () {
      it("should submit a request when the form is submitted");
      it("should focus the input when loaded");
      it("should hide search results when the dropdown is hidden");
      it("should resize itself when the window is resized");
    });
    describe("handleBodyResize", function () {
      it("should resize itself based on the map's size, minus any padding");
    });
    describe("searchSubmit", function () {
      it("should send the text in the input to the search request");
      it("should prevent the event from propagating");
    });
    describe("searchResults", function () {
      it("should convert the start date to a JS date");
      it("should convert the end date to a JS date");
      it("should create drop down entries for each result");
      it("should store the result in the drop down's data");
      it("should add the entries to the drop down");
      it("should bind events to clicking on the drop down");
      it("should prevent clicking on links from closing the dropdown");
      it("should show the drop down if it is not visible");
      it("should set a variable flagging it is open after showing the dropdown");
      it("should not show the drop down if it is already visible");
    });
    describe("hideSearchResults", function () {
      it("should toggle the drop down");
      it("should set a variable flagging it is closed");
    });
    describe("resultSelected", function () {
      it("should set the model's end/start date a minimum of 10 years distant");
      it("should set the model's start and end date directly if they are more than 10 years apart");
      it("should set the center to be the location of the bounding box if the bounding box is a point");
      it("should set the zoom to be 12 if the bounding box is a point");
      it("should calculate the midpoint if the bounding box is not a point");
      it("should create a bounds that is 10% greater than the bounding box");
      it("should set the zoom to be -1 if the bounding box is not a point");
      it("should set the highlights to the id of the clicked result");
      it("should remove all filters");
      it("should trigger a change event");
    });
  }
);
