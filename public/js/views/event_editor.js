define([
  "jquery",
  "underscore",
  "backbone",
  "models/event",
  "collections/events",
  "collections/roles",
  "analytics",
  "text!templates/event_editor.htm",
  "text!templates/participant_editor.htm",
  "bootstrap",
  "jqueryui",
  "parsley",
  "css!/css/event_editor",
  "css!/css/select2-bootstrap"
], function ($, _, Backbone, Event, EventsCollection, RolesCollection,
    analytics, template, participantEditorTemplate) {

  var EventEditor = Backbone.View.extend({
    className: "",

    initialize: function (options) {
      this.newEvent = options.newEvent;
      this.participants = new Backbone.Collection();
      this.eventsCollection = new EventsCollection();
      this.participantEditorTemplate = _.template(participantEditorTemplate);
      this.initializeRoles();
    },

    initializeRoles: function () {
      this.roles = new RolesCollection();
      this.roles.fetch();
    },

    render: function () {
      this.$el.html(template);
      $("body").append(this.$el);

      this.setValues();

      this.$el.find(".modal").modal();
      this.$el.find(".modal").modal("show");

      this.$el.find("input[data-key=end]").datepicker(this.getDatePickerOpts());
      this.$el.find("input[data-key=start]").datepicker(this.getDatePickerOpts(true));
      this.$el.find("input[data-key=start]").on("change", _.bind(this.updateEnd, this));
      this.$el.find(".save").on("click", _.bind(this.handleSave, this));

      this.renderParticipants();

      return this.$el;
    },

    getDatePickerOpts: function (isStart) {
      var date = this.model.get("date");
      var opts = {
        dateFormat: "yy-mm-dd",
        changeYear: true,
        yearRange: (date[0] - 20) + ":" + (date[1] + 20)
      };
      if (isStart) {
        opts.defaultDate = new Date(date[0], 0, 1);
      }
      return opts;
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

      this.$("input[data-key=place]").select2({
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

    renderParticipants: function () {
      var el = this.$("input[data-key=participants]");
      el.select2({
        placeholder: "Add participants",
        multiple: true,
        ajax: {
          url: "/participant",
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

      el.on("change", _.bind(this.addParticipant, this));

      this.$("form").parsley({
        validators: {
          participantexists: function () {
            return {
              validate: function () {
                return el.find(".participant").length > 0;
              },
              priority: 3
            };
          }
        },
        messages: {
          participantexists: "Please add a participant"
        }
      });
    },

    addParticipant: function () {
      var participant = this.getSelectedParticipant();
      participant.name = participant.text;
      participant.roleId = this.roles.at(0).id;
      delete participant.text;
      var participantModel = new this.participants.model(participant);
      this.participants.add(participant);
      var el = $(this.participantEditorTemplate(
        _.extend({roles: this.roles}, participant)
      ));
      el.find(".remove").on("click",
        _.bind(this.removeParticipant, this, participantModel));
      el.find(".role").on("change",
        _.bind(this.changeParticipantRoleSelection, this, participantModel));
      this.$(".participant-list").append(el);

      this.clearParticipantSelector();
    },

    getSelectedParticipant: function () {
      var select = this.$("input[data-key=participants]");
      var participants = select.select2("data");
      return participants[0];
    },

    clearParticipantSelector: function () {
      this.$("input[data-key=participants]").select2("data", []);
    },

    removeParticipant: function (participant, e) {
      this.participants.remove(participant);
      $(e.target).parent().remove();
    },

    changeParticipantRoleSelection: function (participant, e) {
      this.participants.get(participant).set("roleId",
        this.getSelectedRoleId(e));
    },

    getSelectedRoleId: function (e) {
      $(e.target).find(":selected").val();
    },

    handleSave: function () {
      this.$(".error-message").hide();
      if (this.$("form").parsley("validate")) {
        var values = {};
        values.name = this.$el.find("input[data-key=name]").val();
        values.link = this.wrapLink(this.$el.find("input[data-key=link]").val());
        values.start = new Date(this.$el.find("input[data-key=start]").val());
        values.end = new Date(this.$el.find("input[data-key=end]").val());
        values.place = this.getPlaceValue();
        values.participants = this.participants.toJSON();

        var model = new Event(values);
        this.eventsCollection.add(model);
        model.save(null, {
          success: _.bind(this.handleSaveComplete, this, values),
          error: _.bind(this.handleSaveFail, this)
        });
        analytics.eventAdded(values);
      }
    },

    wrapLink: function (link) {
      if (!link.match(/(https?:)?\/\//)) {
        return "//" + link;
      }
      return link;
    },

    getPlaceValue: function () {
      var place = this.$el.find("input[data-key=place]").select2("data");
      place.name = place.text;
      delete place.text;
      return place;
    },

    handleSaveComplete: function (values) {
      this.$el.find(".modal").modal("hide");
      var updatedModel = this.updateHighlight(values);
      if (!updatedModel) {
        //don't always do this because the above may have
        //triggered it with an extra more specific event
        this.model.trigger("change:center");
      }
    },

    updateHighlight: function (values) {
      var highlightId = this.model.get("highlight").id;
      var participantMatchesHighlight = function (participant) {
        return participant.id === highlightId;
      };
      if (_.find(values.participants, participantMatchesHighlight)) {
        this.model.set("highlight", {id: highlightId, reset: true});
        return true;
      }
      return false;
    },

    handleSaveFail: function (model, res) {
      this.$(".error-message").show();
      this.$(".error-message").text(res.responseText.substring(0, 100));
    }

  });

  return EventEditor;

});