define([
  "jquery",
  "underscore",
  "backbone",
  "../models/event",
  "../collections/events",
  "text!templates/event_editor.htm",
  "bootstrap",
  "jqueryui",
  "parsley",
  "css!/css/event_editor",
  "css!/css/select2-bootstrap"
], function ($, _, Backbone, Event, EventsCollection, template) {

  var EventEditor = Backbone.View.extend({
    className: "",

    initialize: function (options) {      
      this.newEvent = options.newEvent;
      this.eventsCollection = new EventsCollection();
    },

    render: function () {
      this.$el.html(template);
      $("body").append(this.$el);

      this.setValues();

      this.$el.find(".modal").modal();
      this.$el.find(".modal").modal("show");

      this.$el.find("input.date").datepicker({ dateFormat: "dd/mm/yy" });  
      this.$el.find("input[data-key=start]").on("change", _.bind(this.updateEnd, this));  
      this.$el.find(".save").on("click", _.bind(this.handleSave, this));
      this.renderAttendees();

      return this.$el;
    },

    updateEnd: function () {
      var end = this.$el.find("input[data-key=end]").val();
      if (!end) {
        this.$el.find("input[data-key=end]").val(this.$el.find("input[data-key=start]").val());
      }
    },

    setValues: function () {
      if (this.newEvent) {
        $.get(
          "/place", 
          {
            lat: this.newEvent.location.lat,
            lon: this.newEvent.location.lon
          },
          _.bind(this.handleGetPlaces, this)
        );
      }
    },

    handleGetPlaces: function (places) {

      var queryResults = _.map(places, function (place) {
        return {
          id: place.id,
          text: place.name + " (" + Math.round(place.distance) + "m)"
        };
      });

      $("input[data-key=place]").select2({
        placeholder: "Select or add a place",
        data: queryResults,
        createSearchChoice: function (text) {
          return {
            id: -1,
            text: text
          };
        }
      });

    },

    renderAttendees: function () {
      $("input[data-key=attendees]").select2({
        placeholder: "Add attendees",
        multiple: true,
        ajax: {
          url: "/attendee",
          dataType: "json",
          data: function (term, page) {
            return {
              q: term,
              page: page
            };
          },
          results: function (data/*, page*/) {
            return {
              results: _.map(data, function (r) {
                return {
                  id: r.id,
                  text: r.name + " (" + r.type + ")"
                };
              })
            };
          }
        },
        createSearchChoice: function (text) {
          return {
            id: -1,
            text: text
          };
        }
      });
    },

    handleSave: function () {
      if (this.$("form").parsley("validate")) {
        var values = {};
        values.name = this.$el.find("input[data-key=name]").val();
        values.link = this.$el.find("input[data-key=link]").val();
        values.start = new Date(this.$el.find("input[data-key=start]").val());
        values.end = new Date(this.$el.find("input[data-key=end]").val());
        values.place = this.$el.find("input[data-key=place]").select2("data");
        values.attendees = this.$el.find("input[data-key=attendees]").select2("data");

        values.place.name = values.place.text;
        delete values.place.text;

        values.attendees = _.map(values.attendees, function (attendee) {
          attendee.name = attendee.text;
          delete attendee.text;
          return attendee;
        });

        var model = new Event(values);
        this.eventsCollection.add(model);
        model.save(null, {
          success: _.bind(this.handleSaveComplete, this),
          error: _.bind(this.handleSaveFail, this)
        });
      }
    },

    handleSaveComplete: function () {
      this.$el.find(".modal").modal("hide");
      // this.$el.remove();
    },

    handleSaveFail: function () {
      window.console.log(arguments);
    }

  });

  return EventEditor;

});