define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "moment",
  "deep-diff",
  "models/event",
  "collections/events",
  "collections/types",
  "collections/roles",
  "collections/event_types",
  "views/type_selector",
  "views/participant_editor",
  "analytics",
  "text!templates/event_editor.htm",
  "text!templates/event_history.htm",
  "text!templates/event_history_item.htm",
  "bootstrap",
  "datetimepicker",
  "parsley",
  "css!/css/event_editor",
  "css!/css/select2-bootstrap",
  "css!/css/datetimepicker"
], function ($, _, Backbone, when, moment, DeepDiff, Event, EventsCollection,
    Types, Roles, EventTypes,
    TypeSelector, ParticipantEditor,
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
      $("body").append(this.$el);

      this.$(".nav .history a").on("click", _.bind(this.showHistoryTab, this));

      this.setValues();

      this.$(".modal").modal();
      this.$(".modal").modal("show");

      this.$("input[data-key=end]").datetimepicker(this.getDatePickerOpts());
      this.$("input[data-key=start]").datetimepicker(this.getDatePickerOpts(true));
      this.$("input[data-key=start]").on("change", _.bind(this.updateEnd, this));
      this.$(".save").on("click", _.bind(this.handleSave, this));

      this.fetchData().then(_.bind(this.populateView, this));

      return this.$el;
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
      this.$(".tab-pane.history").html($(this.historyTemplate()));
      this.historyCollection.each(function (change) {
        try {
          change = change.toJSON();
          change.new_values = _.omit(change.new_values, ["id"]);
          var keys = _.keys(change.new_values);
          var first = _.first(keys);
          var body = this.$(".tab-pane.history tbody");
          body.append($(this.historyItemTemplate(
            _.extend(change, {
              field: first,
              value: change.new_values[first]
            })
          )));
          _.each(_.rest(keys), function (key) {
            body.append($(this.historyItemTemplate(
              {
                date: "",
                username: "",
                field: key,
                value: change.new_values[key]
              }
            )));
          }, this);
        } catch (e) {
          console.log(change);
          console.log(e);
        }
      }, this);
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

    fetchData: function () {
      var thingsToFetch = [];

      thingsToFetch.push(when(this.types.fetch()));
      thingsToFetch.push(when(this.roles.fetch()));
      thingsToFetch.push(when(this.eventTypes.fetch()));

      if (this.model) {
        thingsToFetch.push(
          //todo: get this data from a model
          when($.get("/event/" + this.model.id)).then(_.bind(function (data) {
            this.currentViewData = data;
          }, this))
        );
      }

      return when.all(thingsToFetch);
    },

    populateView: function () {
      this.renderEventTypes();
      this.renderParticipants();
      if (this.model) {
        this.renderExistingEvent();
      }
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

      el.on("change", _.bind(this.addParticipant, this, null));

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
            text: r.name + " (" + r.type + ")"
          };
        })
      };
    },

    addParticipant: function (participant) {
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

      analytics.participantAdded(analyticsData);
    },

    getSelectedParticipant: function () {
      var select = this.$("input[data-key=participants]");
      var participants = select.select2("data");
      var data = participants[0];

      data.name = data.text;
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
      var data = this.currentViewData;
      data.start_date = moment(data.start_date);
      data.end_date = moment(data.end_date);

      data.start_date.add("minutes", data.start_date.zone());
      data.end_date.add("minutes", data.end_date.zone());

      this.model = new Backbone.Model(data);
      this.$el.find("input[data-key=name]").val(this.model.get("name"));
      this.$el.find("input[data-key=place]").val(this.model.get("place").name);
      this.eventTypeSelector.setValue(
        this.model.get("type").id,
        this.model.get("importance").id
      );
      this.$el.find("input[data-key=link]").val(this.model.get("link"));

      var localStartTime = this.model.get("start_date").clone().add("seconds", this.model.get("start_offset_seconds"));
      var localEndTime = this.model.get("end_date").clone().add("seconds", this.model.get("end_offset_seconds"));
      this.$el.find("input[data-key=start]").datetimepicker("setDate", localStartTime.toDate());
      this.$el.find("input[data-key=end]").datepicker("setDate", localEndTime.toDate());

      _.each(this.model.get("participants"), _.bind(this.addParticipant, this));
    },

    handleSave: function () {

      if (this.validate()) {
        var values = this.collectValues();
        if (this.model) {
          this.updateExistingEvent(values);
        } else {
          this.saveNewEvent(values);
        }
      }
    },

    collectValues: function () {
      var values = {};

      if (this.model) {
        values.id = this.model.id;
      }

      values.name = this.$el.find("input[data-key=name]").val();
      values.link = this.wrapLink(this.$el.find("input[data-key=link]").val());
      values.place = this.getPlace();
      values.start_date = moment(this.$el.find("input[data-key=start]").val());
      values.end_date = moment(this.$el.find("input[data-key=end]").val());

      values.start_date.add("seconds", -this.getStartOffset());
      values.end_date.add("seconds", -this.getEndOffset());

      _.extend(values, this.eventTypeSelector.getValue());
      values.participants = this.getParticipantValues();

      return values;
    },

    getStartOffset: function () {
      return (this.startOffset !== undefined) ? this.startOffste : this.model.get("start_offset_seconds");
    },

    getEndOffset: function () {
      return (this.endOffset !== undefined) ? this.endOffset : this.model.get("end_offset_seconds");
    },

    getParticipantValues: function () {
      var values = _.map(_.values(this.participants), function (participant) {
        return participant.getValue();
      });
      return values;
    },

    updateExistingEvent: function (values) {
      var differences = this.getDifferences(values);
      if (_.keys(_.omit(differences, "id")).length > 0) {
        this.sendChangeRequest(differences).then(
          _.bind(this.handleSaveComplete, this, values),
          _.bind(this.handleSaveFail, this, null)
        );
      }
    },

    sendChangeRequest: function (differences) {
      var d = when($.ajax({
        url: "/event",
        type: "PUT",
        processData: false,
        contentType: "application/json",
        data: JSON.stringify(differences)
      }));
      return d;
    },

    getDifferences: function (values) {

      var oldValues = this.model.toJSON();

      var newParticipants = this.getParticipantDifference(oldValues.participants, values.participants);
      var oldParticipants = this.getParticipantDifference(values.participants, oldValues.participants);

      var originalParticipants = values.participants;

      oldValues.participants = this.removeParticipantsFromArray(oldValues.participants, oldParticipants);
      values.participants = this.removeParticipantsFromArray(values.participants, newParticipants);

      var differences = this.getRawDifferences(oldValues, values);

      values.participants = originalParticipants;

      var toSend = {id: this.model.id};
      if (newParticipants.length > 0) {
        toSend.newParticipants = newParticipants;
      }
      if (oldParticipants.length > 0) {
        toSend.removedParticipants = _.map(_.keys(this.getParticipantArrayKeys(oldParticipants)), parseInt);
      }

      var editedParticipants = {};
      _.forEach(differences, function (difference) {
        if (difference.path[0] === "name") {
          toSend.name = difference.rhs;
        }
        else if (difference.path[0] === "link") {
          toSend.link = difference.rhs;
        }
        else if (difference.path[0] === "start_date") {
          toSend.start_date = moment(difference.rhs);
          toSend.start_date.add("minutes", -toSend.start_date.zone());
          toSend.start_date = toSend.start_date.toISOString();
        }
        else if (difference.path[0] === "end_date") {
          toSend.end_date = moment(difference.rhs);
          toSend.end_date.add("minutes", -toSend.end_date.zone());
          toSend.end_date = toSend.end_date.toISOString();
        }
        else if (difference.path[0] === "type") {
          if (!toSend.type) {
            toSend.type = {};
          }
          if (difference.path[1] === "id") {
            toSend.type.id = difference.rhs;
          } else if (difference.path[1] === "name") {
            toSend.type.name = difference.rhs;
          }
        }
        else if ((difference.path[0] === "importance") && (difference.path[1] === "id")) {
          toSend.importance = {
            id: difference.rhs,
            name: values.importance.name
          };
        } else if (difference.path[0] === "participants") {
          editedParticipants[difference.index] = editedParticipants[difference.index] || {};
          var editedParticipant = editedParticipants[difference.index];
          var path = difference.item.path;
          editedParticipant[path[0]] = editedParticipant[path[0]] || {};
          editedParticipant[path[0]][path[1]] = difference.item.rhs;
        }
      });
      if (_.keys(editedParticipants).length > 0) {
        toSend.editedParticipants = _.map(editedParticipants, function (value, key) {
          var obj = {
            thing: {
              id: values.participants[key].thing.id
            }
          };
          _.forEach(value, function (value, key) {
            obj[key] = value;
          });
          return obj;
        });
      }
      return toSend;
    },

    getParticipantDifference: function (base, comparator) {
      var keys = this.getParticipantArrayKeys(base);
      var onlyInComparator = _.filter(comparator, function (participant) {
        var id = participant.thing.id;
        if (id === -1) {
          return true;
        }
        return !keys[id];
      });
      return onlyInComparator;
    },

    removeParticipantsFromArray: function (base, toRemove) {
      var keys = this.getParticipantArrayKeys(toRemove);
      var filteredParticipants = _.filter(base, function (participant) {
        return !keys[participant.thing.id];
      });
      return filteredParticipants;
    },

    getParticipantArrayKeys: function (participants) {
      return _.groupBy(participants, function (participant) {
        return participant.thing.id;
      });
    },

    getRawDifferences: function (oldValues, values) {
      var previous = _.omit(oldValues, ["location", "place",
        "start_offset_seconds", "end_offset_seconds"]);
      var current = _.omit(values, ["place"]);
      previous.start_date = previous.start_date.toISOString();
      previous.end_date = previous.end_date.toISOString();
      current.start_date = current.start_date.toISOString();
      current.end_date = current.end_date.toISOString();

      var diff = DeepDiff.diff(previous, current);
      return diff;
    },

    saveNewEvent: function (values) {
      //TODO: do I need to do this here?

      // toSend.start_date.add("minutes", -toSend.start_date.zone());
      // toSend.end_date.add("minutes", -toSend.end_date.zone());
      var model = new Event(values);
      this.eventsCollection.add(model);
      model.save(null, {
        success: _.bind(this.handleSaveComplete, this, values),
        error: _.bind(this.handleSaveFail, this)
      });
      analytics.eventAdded(values);
    },

    validate: function () {
      var ok = true;
      this.$(".error-message").hide();
      ok = ok && this.$("form").parsley("validate");
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
      if (!link.match(/(https?:)?\/\//)) {
        return "//" + link;
      }
      return link;
    },

    getSelectValue: function (key) {
      var value = this.$el.find("input[data-key=" + key + "]").select2("data");
      value.name = value.text;
      delete value.text;
      return value;
    },

    handleSaveComplete: function (values) {
      this.$el.find(".modal").modal("hide");
      var updatedModel = this.updateHighlight(values);
      if (!updatedModel) {
        //don't always do this because the above may have
        //triggered it with an extra more specific event
        this.state.trigger("change:center");
      }
    },

    updateHighlight: function (values) {
      var highlightId = this.state.get("highlight").id;
      var participantMatchesHighlight = function (participant) {
        return participant.thing.id === highlightId;
      };

      if (
            _.find(values.participants, participantMatchesHighlight) ||
            _.find(this.model.get("participants"), participantMatchesHighlight)
          ) {
        this.state.set("highlight", {id: highlightId, reset: true});
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
