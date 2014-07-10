define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "moment",
  "numeral",
  "models/event",
  "collections/events",
  "collections/types",
  "collections/roles",
  "collections/event_types",
  "views/type_selector",
  "views/participant_editor",
  "views/date_selector",
  "utils/history_renderer",
  "utils/parsley_listener",
  "analytics",
  "text!templates/event_editor.htm",
  "bootstrap",
  "parsley",
  "less!../../css/event_editor",
  "less!../../css/select2-bootstrap"
], function ($, _, Backbone, when, moment, numeral,
    Event, EventsCollection,
    Types, Roles, EventTypes,
    TypeSelector, ParticipantEditor, DateSelector,
    HistoryRenderer, ParsleyListener,
    analytics, template, historyTemplate, historyItemTemplate) {

  var EventEditor = Backbone.View.extend({
    className: "",

    initialize: function (options) {
      this.state = options.state;
      this.newEvent = options.newEvent;
      this.eventsCollection = new EventsCollection();

      this.types = Types.instance;
      this.roles = Roles.instance;
      this.eventTypes = EventTypes.instance;

      this.historyTemplate = _.template(historyTemplate);
      this.historyItemTemplate = _.template(historyItemTemplate);

      this.nextParticipantId = 1;
      this.participants = {};
    },

    render: function () {
      this.$el.html(template);

      this.renderEditReason();

      this.$(".nav .history a").on("click", _.bind(this.showHistoryTab, this));

      var date = this.state.get("date");
      var defaultDate = moment([(date[0] + date[1]) / 2, 0, 1]).toDate();

      this.startDateSelector = new DateSelector({
        date: defaultDate,
        input: this.$("input[data-key=start]")
      }).render();

      this.endDateSelector = new DateSelector({
        date: defaultDate,
        input: this.$("input[data-key=end]")
      }).render();

      this.startDateSelector.on("show", _.bind(function () {
        this.endDateSelector.hidePopup();
      }, this));

      this.endDateSelector.on("show", _.bind(function () {
        this.startDateSelector.hidePopup();
      }, this));

      this.$("input[data-key=end]").val("");

      this.updateEnd();

      this.startDateSelector.on("change", _.bind(this.updateEnd, this));
      this.$(".save").on("click", _.bind(this.handleSave, this));
      this.$(".modal").on("hidden.bs.modal", _.bind(this.handleClose, this));

      this.addValidators();
      this.$(".details form").hide();
      this.$(".details .loading").show();
      this.fetchData().then(_.bind(this.populateView, this));

      this.show();

      return this.$el;
    },

    show: function () {
      $("body").append(this.$el);
      this.showModal();
    },

    showModal: function () {
      this.$(".modal").modal();
      this.$(".modal").modal("show");
    },

    renderEditReason: function () {
      if (this.model) {
        this.$("textarea[data-key=reason]").attr("required", true);
      } else {
        this.$("textarea[data-key=reason]").parent().hide();
      }
    },

    showHistoryTab: function () {
      if (!this.historyCollection) {
        this.fetchHistory().then(_.bind(this.renderHistory, this));
      }
    },

    fetchHistory: function () {
      this.historyCollection = new (Backbone.Collection.extend({
        url: "event/" + this.model.id + "/change",
        parse: function (changes) {
          return _.map(changes, function (change) {
            change.date = new Date(change.date);
            return change;
          });
        }
      }))();
      return when(this.historyCollection.fetch());
    },

    renderHistory: function () {
      this.$(".tab-pane.history").append(HistoryRenderer(this.historyCollection));
    },

    getDatePickerOpts: function (isStart) {
      var date = this.state.get("date");
      var opts = {
        dateFormat: "yy-mm-dd",
        changeYear: true,
        yearRange: (date[0] - 20) + ":" + (date[1] + 20)
      };
      if (isStart) {
        opts.defaultDate = new Date((date[0] + date[1]) / 2, 0, 1);
      }
      return opts;
    },

    updateEnd: function () {
      var start = this.getStartDate();
      var endOfDay = start.endOf("day").toDate();
      if (!this.$("input[data-key=end]").val()) {
        this.endDateSelector.setDate(endOfDay);
      } else if (this.lastStart) {
        var end = this.getEndDate();
        if (this.lastStart.endOf("day").isSame(end, "minute")) {
          this.endDateSelector.setDate(endOfDay);
        }
      }
      this.lastStart = start;
    },

    addValidators: function () {
      var el = this.$el;
      var self = this;
      window.ParsleyValidator
        .addValidator("endafterstart", function () {
          var start = self.startDateSelector.getDate().getTime();
          var end = self.endDateSelector.getDate().getTime();
          return end >= start;
        }, 32)
        .addMessage("en", "endafterstart", "The end date should be after the start");

      window.ParsleyValidator
        .addValidator("participantexists", function () {
          return el.find(".participant-editor").length > 0;
        }, 33)
        .addMessage("en", "participantexists", "Please add a participant");

      window.ParsleyValidator
        .addValidator("changemade", _.bind(function () {
          if (this.model) {
            return this.model.hasDifferences(this.collectValues());
          } else {
            return true;
          }
        }, this), 3)
        .addMessage("en", "changemade", "No changes made");

    },

    fetchData: function () {
      var thingsToFetch = [];

      thingsToFetch.push(when(this.types.fetch()));
      thingsToFetch.push(when(this.eventTypes.fetch()));

      thingsToFetch.push(this.getNearestPlaces());

      if (this.model) {
        var d = when.defer();
        when(this.model.fetch()).then(_.bind(function () {
          this.roles.setEventType(this.model.get("type").id);
          when(this.roles.fetch()).then(d.resolve, d.reject);
        }, this), d.reject);
        thingsToFetch.push(d.promise);
      }

      return when.all(thingsToFetch);
    },

    getNearestPlaces: function () {
      var coords;
      if (this.newEvent) {
        coords = {
          lat: this.newEvent.location.lat,
          lon: this.newEvent.location.lon
        };
      } else if (this.model) {
        coords = {
          lat: this.model.get("lat"),
          lon: this.model.get("lon")
        };
      }
      //todo: store this in a collection
      return when($.get(
        "/place",
        coords,
        _.bind(this.handleGetNearestPlaces, this)
      ));
    },

    handleGetNearestPlaces: function (places) {
      this.nearestPlaces = places;
    },

    populateView: function () {
      this.$(".details form").show();
      this.$(".details .loading").hide();
      this.renderEventTypes();
      this.renderParticipants();
      if (this.model) {
        this.renderExistingEvent();
      }
      this.renderPlaces();
    },

    renderEventTypes: function () {
      this.eventTypeSelector = new TypeSelector({
        type: "event type",
        typePlaceholder: "Select or add an event type",
        importancePlaceholder: "Select or add an event importance",
        types: this.eventTypes
      });
      this.$(".event-type-selector-holder").append(
        this.eventTypeSelector.render()
      );
      this.eventTypeSelector.on("change:type", this.eventTypeSelected, this);
    },

    eventTypeSelected: function (eventTypeId) {
      var changed = this.roles.setEventType(eventTypeId);
      if (changed) {
        when(this.roles.fetch()).then(_.bind(function () {
          _.each(this.participants, function (participantEditor) {
            participantEditor.updateRoles();
          });
          this.$("input[data-key=participants]").select2("enable", true);
        }, this));
      } else {
        this.$("input[data-key=participants]").select2("enable", true);
      }
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
          results: _.bind(this.getSelectableParticipants, this)
        },
        createSearchChoice: function (text) {
          return {
            id: -1,
            text: text
          };
        }
      });
      el.select2("disable", true);
      el.on("change", _.bind(this.addParticipant, this, null));

    },

    renderPlaces: function () {

      var queryResults = _.map(this.nearestPlaces, function (place) {
        var text = place.name;
        if (place.distance > 100) {
          text += " (" + numeral(place.distance / 1000).format("0,0.0") + " km)";
        }
        return {
          id: place.id,
          text: text
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

      if (this.model) {
        this.$("input[data-key=place]")
          .select2("val", this.model.get("place").id);
      }
    },

    getSelectableParticipants: function (data/*, page*/) {
      var keys = _.map(_.values(this.participants), function (x) {
        return x.model.get("thing").id;
      });
      data = _.filter(data, function (el) {
        return !_.contains(keys, el.id);
      });
      return {
        results: _.map(data, function (r) {
          return {
            id: r.id,
            text: r.name + " (" + r.type + ")",
            name: r.name
          };
        })
      };
    },

    addParticipant: function (participant, existing) {
      if (!participant) {
        participant = this.getSelectedParticipant();
      }

      var participantEditor = new ParticipantEditor({
        model: new Backbone.Model(participant),
        roles: this.roles,
        id: this.nextParticipantId
      });

      this.participants[this.nextParticipantId] = participantEditor;

      var analyticsData = {
        isNew: participant.id === -1,
        name: participant.name
      };

      participantEditor.on("remove", _.bind(this.removeParticipant, this, this.nextParticipantId, analyticsData));

      this.nextParticipantId += 1;

      this.$(".participant-list").append(participantEditor.render());

      this.clearParticipantSelector();

      if (!existing) {
        analytics.participantAdded(analyticsData);
      }
    },

    getSelectedParticipant: function () {
      var select = this.$("input[data-key=participants]");
      var participants = select.select2("data");
      var data = participants[0];
      delete data.text;

      return {thing: data};
    },

    removeParticipant: function (id, analyticsData) {
      delete this.participants[id];
      analytics.participantRemoved(analyticsData);
    },

    clearParticipantSelector: function () {
      this.$("input[data-key=participants]").select2("data", []);
    },

    getSelectedRoleId: function (e) {
      $(e.target).find(":selected").val();
    },

    renderExistingEvent: function () {
      this.$el.find("input[data-key=name]").val(this.model.get("name"));
      this.$el.find("input[data-key=place]").val(this.model.get("place").name);
      this.eventTypeSelector.setValue(
        this.model.get("type").id,
        this.model.get("importance").id
      );
      this.$el.find("input[data-key=link]").val(this.model.get("link"));

      var localStartTime = this.getLocalTime("start_date", "start_offset_seconds");
      var localEndTime = this.getLocalTime("end_date", "end_offset_seconds");

      this.renderTimes(localStartTime, localEndTime);

      _.each(this.model.get("participants"), _.bind(function (participant) {
        this.addParticipant(participant, true);
      }, this));
    },

    getLocalTime: function (key, offsetKey) {
      return this.model.get(key)
        .clone()
        .add("seconds", this.model.get(offsetKey));
    },

    renderTimes: function (localStartTime, localEndTime) {
      this.startDateSelector.setDate(localStartTime.toDate());
      this.endDateSelector.setDate(localEndTime.toDate());
    },

    handleSave: function () {
      analytics.eventSaveClicked(this.model ? this.model.toJSON() : {
        name: this.$el.find("input[data-key=name]").val()
      });
      if (this.validate()) {
        var values = this.collectValues();
        if (this.model) {
          return this.updateExistingEvent(values);
        } else {
          return this.saveNewEvent(values);
        }
      } else {
        return this.validationFailed();
      }
    },

    validationFailed: function () {
      this.$("ul.parsley-errors-list").removeClass("alert alert-danger");
      ParsleyListener.bindGlobalParsleyListener();
      this.$("ul.parsley-errors-list.filled").addClass("alert alert-danger");
      analytics.eventSaveValidationFailed({
        fields: this.getErrorFields()
      });
      return when.reject();
    },

    getErrorFields: function () {
      return _.toArray(
        this.$(".parsley-errors-list.filled")
          .parent()
          .find("label")
          .map(function (i, el) {
            return $(el).text();
          })
        );
    },

    collectValues: function () {
      var values = {};

      if (this.model) {
        values.id = this.model.id;
      }

      values.name = this.$el.find("input[data-key=name]").val();
      values.link = this.wrapLink(this.$el.find("input[data-key=link]").val());
      values.place = this.getPlace();
      values.start_date = this.getStartDate();
      values.end_date = this.getEndDate();

      if (this.model) {
        values.start_date.add("seconds", -this.model.get("start_offset_seconds"));
        values.end_date.add("seconds", -this.model.get("end_offset_seconds"));
      }

      _.extend(values, this.eventTypeSelector.getValue());
      values.participants = this.getParticipantValues();

      return values;
    },

    getStartDate: function () {
      return moment(this.$el.find("input[data-key=start]").val(), "YYYYY-MM-DD HH:mm");
    },

    getEndDate: function () {
      return moment(this.$el.find("input[data-key=end]").val(), "YYYYY-MM-DD HH:mm");
    },

    getParticipantValues: function () {
      var values = _.map(_.values(this.participants), function (participant) {
        return participant.getValue();
      });
      return values;
    },

    updateExistingEvent: function (values) {

      var reason = this.$("textarea[data-key=reason]").val();
      return this.model.update(values, reason).then(
        _.bind(this.handleSaveComplete, this, values),
        _.bind(this.handleSaveFail, this)
      );

    },

    saveNewEvent: function (values) {

      //todo: do this consistently in one place
      //compare with model/event as well!
      values.start_date = values.start_date.add("minutes", -values.start_date.zone());
      values.end_date = values.end_date.add("minutes", -values.end_date.zone());

      var model = new Event(values);
      this.eventsCollection.add(model);
      return when(model.save(null, {})).then(
        _.bind(this.handleSaveComplete, this, values),
        _.bind(this.handleSaveFail, this)
      );
    },

    validate: function () {
      var ok = true;
      this.$(".error-message").hide();

      ok = ok && this.$("form").parsley().validate();
      ok = ok && this.eventTypeSelector.validate();
      _.each(_.values(this.participants), function (participant) {
        ok = ok && participant.validate();
      });

      return ok;
    },

    getPlace: function () {
      var value = this.getSelectValue("place");
      if (value.id === -1) {
        value.lat = this.newEvent.location.lat;
        value.lon = this.newEvent.location.lon;
      }
      return value;
    },

    wrapLink: function (link) {
      if ((link.length > 0) && !link.match(/(https?:)?\/\//)) {
        link = "//" + link;
      }
      return link;
    },

    getSelectValue: function (key) {
      var value = _.clone(this.$el.find("input[data-key=" + key + "]").select2("data"));
      value.name = value.text;
      delete value.text;
      return value;
    },

    handleSaveComplete: function (values, result) {
      if (this.model) {
        analytics.eventSaved(values);
      } else {
        analytics.eventAdded(values);
      }

      this.hide();
      this.updateHighlight(values, result && result.id);
      //force a refresh of data
      this.state.trigger("change:center");
    },

    hide: function () {
      this.$el.find(".modal").modal("hide");
    },

    updateHighlight: function (values, newEventId) {
      var highlightId = this.state.get("highlight").id;
      var participantMatchesHighlight = function (participant) {
        return participant.thing.id === highlightId;
      };

      if (
            _.find(values.participants, participantMatchesHighlight) ||
            this.model && _.find(this.model.get("participants"), participantMatchesHighlight)
          ) {
        this.state.set({
          "highlight": {id: highlightId, reset: true},
          "selectedEventId": newEventId
        });
        return true;
      }
      return false;
    },

    handleSaveFail: function (res) {
      this.$(".error-message").show();
      var text;
      if (res.responseText.indexOf("last_edited times do not match") >= 0) {
        text = "Event can't be saved - it has been edited by someone else. Refresh and try again";
      } else if (res.responseText === "Unauthorized") {
        text = "You have been logged out: duplicate this tab and log in, then save again here.";
      } else {
        text = res.responseText.substring(0, 100);
      }
      this.$(".error-message").text(text);
    },

    handleClose: function () {
      this.$el.remove();
    }

  });

  return EventEditor;

});
