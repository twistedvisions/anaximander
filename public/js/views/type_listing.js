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
  typeListingTemplate = _.template(typeListingTemplate);
  importanceListingTemplate = _.template(importanceListingTemplate);
  var TypeListing = Backbone.View.extend({
    className: "type-listing",
    initialize: function (/*options*/) {

    },

    render: function () {
      $(this.el).html(template);

      this.$("#event-tab a").on("click", _.bind(this.showEventTypes, this));
      this.$("#role-tab a").on("click", _.bind(this.showRoles, this));
      this.getThingTypes().then(_.bind(this.showThingTypes, this));

      this.showEventTypes();

      this.$("div.importances").hide();

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
        this.showThingSubtype($(e.target).data().id);
      }, this));
    },

    showEventTypes: function () {
      when.all([this.getData("/event_type"), this.getData("/event_type/usage")])
        .then(_.bind(this.showTypes, this));
    },

    showRoles: function () {
      when.all([this.getData("/role"), this.getData("/role/usage")])
        .then(_.bind(this.showTypes, this));
    },

    showThingSubtype: function (id) {
      when.all([
        this.getData("/type/" + id + "/type"),
        this.getData("/type/" + id + "/type/usage")
      ]).then(_.bind(this.showTypes, this));
    },

    getData: function (url) {
      return $.get(url);
    },

    showTypes: function (args) {
      var types = args[0], usages = args[1];
      this.$("div.types").show();
      this.$("div.importances").hide();
      this.types = _.indexBy(types, "id");
      this.usages = _.indexBy(usages, "id");
      this.$(".types tbody").empty();
      _.each(types, function (type) {
        var usage = this.usages[type.id];
        var html = $(typeListingTemplate(_.extend(type, {
          usage: usage ? usage.usage : 0
        })));
        this.$(".types tbody").append(html);
      }, this);
      this.$(".types tbody td.name").on("click", _.bind(this.editCell, this, {
        key: "name",
        save: _.bind(this.saveTypeChange, this)
      }));
      this.$(".default-importance select").on("change", _.bind(this.handleDefaultImportanceChange, this));
      this.$(".types tbody td.view-importances span").on("click", _.bind(this.showImportances, this));
    },

    handleDefaultImportanceChange: function (e) {
      var el = $(e.target);
      var row = el.parents("tr");
      var value = el.val();
      if (this.types[row.data().id].default_importance_id !== value) {
        var result = this.getTypeChangeObject(row);
        result.defaultImportanceId = value;
        el.attr("disabled", true);
        this.saveTypeChange(result).then(function () {
          el.attr("disabled", false);
        });
      }

    },

    saveTypeChange: function (changes) {
      var d = when($.ajax({
        url: "/type",
        type: "PUT",
        processData: false,
        contentType: "application/json",
        data: JSON.stringify(changes)
      }));
      return d;
    },

    showImportances: function (e) {
      var el = $(e.target);
      var id = el.parents("tr").data().id;
      this.$("div.types").hide();
      this.$("div.importances").show();
      this.$(".importances tbody").empty();
      var type = this.types[id];
      this.$(".selected-type").text(type.name);
      _.each(type.importances, function (importance) {
        var html = $(importanceListingTemplate(importance));
        this.$(".importances tbody").append(html);
      }, this);
      this.$(".importances tbody td.name").on("click", _.bind(this.editCell, this, {}));
      this.$(".importances tbody td.description").on("click", _.bind(this.editCell, this, {}));
      this.$(".importances tbody td.value").on("click", _.bind(this.editCell, this, {
        type: "number"
      }));
      this.$(".importances .close").on("click", _.bind(function () {
        this.$("div.types").show();
        this.$("div.importances").hide();
      }, this));
    },

    editCell: function (options, e) {
      if (!e) {
        e = options;
        options = {};
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
          value = input.val();
          input.attr("disabled", true);
          var data = row.data();
          if (value !== this.types[data.id][options.key]) {
            var result = this.getTypeChangeObject(row);
            result[options.key] = value;
            options.save(result).then(function () {
              input.trigger("blur");
            });
          } else {
            input.trigger("blur");
          }
        }
      }, this));

      input.focus();
      input.select();
    },

    getTypeChangeObject: function (row) {
      var data = row.data();
      return {
        id: data.id,
        last_edited: data.lastEdited
      };
    }
  });
  return TypeListing;
});