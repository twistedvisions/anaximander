define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "analytics",
  "text!templates/type_listings.htm",
  "text!templates/type_entry.htm",
  "text!templates/importance_entry.htm",
  "css!/css/type_listing.css",
  "underscore_string"
], function ($, _, Backbone, when, analytics,
    template, typeListingTemplate, importanceListingTemplate) {
  template = _.template(template);
  var TypeListing = Backbone.View.extend({
    className: "type-listing",
    initialize: function (options) {
      this.user = options.user;
      this.typeListingTemplate = _.template(typeListingTemplate);
      this.importanceListingTemplate = _.template(importanceListingTemplate);
    },

    render: function () {
      $(this.el).html(template);

      this.$("#event-tab a").on("click", _.bind(this.showEventTypes, this));
      this.$("#role-tab a").on("click", _.bind(this.showRoles, this));
      this.getThingTypes().then(_.bind(this.showThingTypes, this));

      this.showEventTypes();

      this.$("div.importances").hide();

      this.$(".error-holder > div .close").on("click", function (e) {
        $(e.target).parent().hide();
      });

      return this.$el;
    },

    getThingTypes: function () {
      return when(this.getData("/type"));
    },

    showThingTypes: function (types) {
      var thingTab = _.template([
        "<li class=\"type-type-tab\" >",
        "  <a href=\"#\" tabindex=\"-1\" data-id=\"<%= id %>\" data-toggle=\"tab\">",
        "    <%= _.string.capitalize(name) %>",
        "  </a>",
        "</li>"
      ].join(""));
      _.each(types, function (type) {
        this.$(".thing-tab ul").append(thingTab(type));
      }, this);
      this.$(".type-type-tab a").on("click", _.bind(function (e) {
        var el = $(e.target);
        var subtypeId = el.data().id;
        this.currentSubtypeId = subtypeId;
        this.showThingSubtype(subtypeId, el.text());
      }, this));
    },

    showEventTypes: function () {
      this.selectedTypeId = 2;
      analytics.typeListing_showTypes({
        typeId: this.selectedTypeId,
        typeName: "event types"
      });
      when.all([this.getData("/event_type"), this.getData("/event_type/usage")])
        .then(_.bind(this.showTypes, this));
    },

    showRoles: function () {
      this.selectedTypeId = 3;
      analytics.typeListing_showTypes({
        typeId: this.selectedTypeId,
        typeName: "roles"
      });
      when.all([this.getData("/role"), this.getData("/role/usage")])
        .then(_.bind(this.showTypes, this));
    },

    showThingSubtype: function (id, name) {
      this.selectedTypeId = 4;
      analytics.typeListing_showTypes({
        typeId: this.selectedTypeId,
        subtypeId: id,
        typeName: name
      });
      when.all([
        this.getData("/type/" + id + "/type"),
        this.getData("/type/" + id + "/type/usage")
      ]).then(_.bind(this.showTypes, this));
    },

    getData: function (url) {
      return when($.get(url));
    },

    showTypes: function (args) {
      var types = args[0], usages = args[1];
      this.$("div.types").show();
      this.$("div.importances").hide();
      this.types = _.indexBy(types, "id");
      this.usages = _.indexBy(usages, "id");
      this.$(".types tbody").empty();
      _.each(types, function (type) {
        var html = $(this.typeListingTemplate(this.getTypeObj(type)));
        this.$(".types tbody").append(html);
      }, this);
      this.bindTypeRowEvents();
    },

    bindTypeRowEvents: function (row) {

      var rows = row || this.$(".types tbody tr");
      var bindRowEvents = _.bind(this.bindTypeRowEvents, this);
      if (this.user.hasPermission("edit-type")) {
        rows.find("td.name").on("click", _.bind(this.editCell, this, {
          valueType: "type",
          key: "name",
          isDifferent: function (newValue, oldValue) {
            return newValue.toLowerCase() !== oldValue.toLowerCase();
          },
          save: _.bind(this.saveTypeChange, this),
          bindRowEvents: bindRowEvents
        }, this.types));
        rows.find("td.default-importance select").on("change", _.bind(this.handleDefaultImportanceChange, this));
      } else {
        rows.find("td.default-importance select").attr("disabled", true);
      }
      rows.find("td.view-importances span").on("click", _.bind(this.getImportances, this));

    },

    getTypeObj: function (type) {
      var usage = this.usages[type.id];
      return _.extend(type, {
        usage: usage ? usage.usage : 0
      });
    },

    handleDefaultImportanceChange: function (e) {
      var el = $(e.target);
      var row = el.parents("tr");
      var id = row.data().id;
      var oldValue = this.types[id].default_importance_id;
      var value = parseInt(el.val(), 10);
      if (oldValue !== value) {
        var result = this.getChangeObject(row);
        result.defaultImportanceId = value;
        el.attr("disabled", true);
        this.saveTypeChange(result).then(
          function (newRow) {
            analytics.typeListing_typeSaved({
              key: "defaultImportanceId",
              value: value
            });
            row.replaceWith(newRow);
            el.attr("disabled", false);
          },
          _.bind(function () {
            el.val(oldValue);
            this.$(".not-logged-in").show();
            el.attr("disabled", false);
          }, this)
        );
      }
    },

    saveTypeChange: function (changes) {
      var d = when.defer();
      changes.typeId = this.selectedTypeId;
      when($.ajax({
        url: "/type",
        type: "PUT",
        processData: false,
        contentType: "application/json",
        data: JSON.stringify(changes)
      })).then(
        _.bind(function (type) {
          d.resolve(this.handleTypeChange(type));
        }, this),
        d.reject
      );
      return d.promise;
    },

    handleTypeChange: function (type) {
      _.extend(this.types[type.id], type);
      return $(this.typeListingTemplate(this.getTypeObj(this.types[type.id])));
    },

    getImportances: function (e) {
      var el = $(e.target);
      var id = el.parents("tr").data().id;
      var type = this.$(".type-selector .active").data().key;
      if (type === "thing_subtype") {
        type = "type/" + this.currentSubtypeId + "/type";
      }
      var url = "/" + type + "/" + id + "/importance/usage";
      this.getImportanceData(url).then(_.bind(this.showImportances, this, id));
    },

    getImportanceData: function (url) {
      return when($.get(url));
    },

    showImportances: function (typeId, importanceUsage) {
      analytics.typeListing_showImportances({
        typeId: typeId
      });
      this.$("div.types").hide();
      this.$("div.importances").show();
      this.$(".importances tbody").empty();
      var type = this.types[typeId];
      this.$(".selected-type").text(type.name);
      this.importanceUsage = _.groupBy(importanceUsage, "id");
      _.each(type.importances, function (importance) {
        var html = $(this.importanceListingTemplate(this.getImportanceObj(importance)));
        this.$(".importances tbody").append(html);
      }, this);
      this.importances = _.groupBy(type.importances, "id");
      this.bindImportanceRowEvents(typeId);
      this.$(".importances .close").on("click", _.bind(function () {
        analytics.typeListing_hideImportances({
          typeId: typeId
        });
        this.$("div.types").show();
        this.$("div.importances").hide();
      }, this));
    },

    getImportanceObj: function (importance) {
      var usage = this.importanceUsage[importance.id] ?
        this.importanceUsage[importance.id][0].usage :
        0;
      return _.extend(importance, {
        usage: usage
      });
    },

    bindImportanceRowEvents: function (typeId, row) {
      var saveCall = _.bind(this.saveImportanceChange, this, typeId);
      var bindRowEvents = _.bind(this.bindImportanceRowEvents, this, typeId);
      var rows = row || this.$(".importances tbody tr");
      if (this.user.hasPermission("edit-importance")) {
        rows.find("td.name").on("click", _.bind(this.editCell, this, {
          valueType: "importance",
          key: "name",
          isDifferent: function (newValue, oldValue) {
            return newValue.toLowerCase() !== oldValue.toLowerCase();
          },
          save: saveCall,
          bindRowEvents: bindRowEvents
        }, this.importances));
        rows.find("td.description").on("click", _.bind(this.editCell, this, {
          valueType: "importance",
          key: "description",
          save: saveCall,
          bindRowEvents: bindRowEvents
        }, this.importances));
        rows.find("td.value").on("click", _.bind(this.editCell, this, {
          valueType: "importance",
          type: "number",
          key: "value",
          save: saveCall,
          bindRowEvents: bindRowEvents
        }, this.importances));
      }
    },

    saveImportanceChange: function (typeId, changes) {
      var d = when.defer();
      changes.typeId = typeId;
      when($.ajax({
        url: "/importance",
        type: "PUT",
        processData: false,
        contentType: "application/json",
        data: JSON.stringify(changes)
      })).then(
        _.bind(function (importance) {
          _.extend(this.importances[importance.id], importance);
          d.resolve($(this.importanceListingTemplate(this.getImportanceObj(this.importances[importance.id]))));
        }, this),
        d.reject
      );
      return d.promise;
    },

    editCell: function (options, values, e) {

      analytics["typeListing_" + options.valueType + "Edited"]({
        key: options.key
      });

      if (!e) {
        e = options;
        options = {};
      }

      if (!options.isDifferent) {
        options.isDifferent = function (newValue, oldValue) {
          return newValue !== oldValue;
        };
      }

      var el = $(e.target);
      var row = el.parents("tr");
      var value = el.text();
      el.empty();
      options.type = options.type || "text";
      var input = $("<input type='" + options.type + "' class='form-control input-sm'>");
      input.val(value);
      el.append(input);
      el.addClass("editing");

      input.on("blur", _.bind(function () {
        el.removeClass("editing");
        el.empty();
        el.text(value);
      }, this));

      input.on("keydown", _.bind(function (e) {
        if (e.keyCode === 13) {
          var newValue = input.val();
          input.attr("disabled", true);
          var data = row.data();
          if (options.isDifferent(newValue, values[data.id][options.key])) {
            var result = this.getChangeObject(row);
            result[options.key] = newValue;
            options.save(result).then(
              function (newRow) {

                analytics["typeListing_" + options.valueType + "Saved"]({
                  key: options.key,
                  value: newValue
                });

                if (newRow) {
                  row.replaceWith(newRow);
                  if (options.bindRowEvents) {
                    options.bindRowEvents(newRow);
                  }
                }

              },
              _.bind(function () {
                this.$(".not-logged-in").show();
              }, this)
            );
          } else {
            input.trigger("blur");
          }
        }
      }, this));

      input.focus();
      input.select();
    },

    getChangeObject: function (row) {
      var data = row.data();
      return {
        id: data.id,
        last_edited: data.lastEdited
      };
    }
  });
  return TypeListing;
});