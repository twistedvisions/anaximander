define([
  "jquery",
  "underscore",
  "moment",
  "text!templates/event_history.htm",
  "text!templates/event_history_item.htm",
  "less!../../css/changes"
], function ($, _, moment, historyTemplate, historyItemTemplate) {
  historyTemplate = _.template(historyTemplate);
  historyItemTemplate = _.template(historyItemTemplate);
  var omittedKeys = [
    //events
    "participants", "newParticipants", "editedParticipants", "removedParticipants",
    //things
    "subtypes", "newSubtypes", "editedSubtypes", "removedSubtypes",
    //type
    "defaultImportance"
  ];
  var getKeyValues = function (values) {
    var keyValues = [];
    _.chain(values)
      .omit(omittedKeys)
      .keys()
      .each(function (key) {
        keyValues.push([key, values[key]]);
      });
    _.each(values.participants, function (participant) {
      keyValues.push(["participant added", participant]);
    });
    _.each(values.newParticipants, function (participant) {
      keyValues.push(["participant added", participant]);
    });
    _.each(values.editedParticipants, function (participant) {
      keyValues.push(["participant edited", participant]);
    });
    _.each(values.removedParticipants, function (participant) {
      keyValues.push(["participant removed", participant]);
    });
    _.each(values.subtypes, function (subtype) {
      keyValues.push(["subtype added", subtype]);
    });
    _.each(values.newSubtypes, function (subtype) {
      keyValues.push(["subtype added", subtype]);
    });
    _.each(values.editedSubtypes, function (subtype) {
      keyValues.push(["subtype edited", subtype]);
    });
    _.each(values.removedSubtypes, function (subtype) {
      keyValues.push(["subtype removed", subtype]);
    });
    if (values.defaultImportance) {
      keyValues.push(["default importance", values.defaultImportance]);
    }
    return keyValues;
  };

  var longTimestampRegex = /(\d\d\d\d\-\d\d\-\d\d \d\d:\d\d:\d\d)([+\-])(\d\d:\d\d:\d\d)/;

  var getDate = function (str) {
    var d = new Date(str);
    if (isNaN(d.getTime())) {
      var m = str.match(longTimestampRegex);
      if (m) {
        d = new Date(
          moment(m[1]).valueOf() +
          (m[2] === "-" ? 1 : -1) * moment("1970-01-01 " + m[3]).valueOf()
        );
      }
    }
    return d;
  };

  var getValue = function (key, value, change) {
    if (key.indexOf("date") >= 0) {
      var date = moment(getDate(value));
      date.add("minutes", date.zone());
      var offsetKey = key.replace("_date", "_offset_seconds");
      if (change.new_values[offsetKey]) {
        date.add("seconds", change.new_values[offsetKey]);
      }
      var str = date.format("lll");
      if (str === "Invalid date") {
        str = date.format("YYYY-mm-dd hh:mm:ss");
      }
      return str;
    } else if (key.indexOf("offset") >= 0) {
      return null;
    } else if (key.indexOf("link") >= 0) {
      return "<a href='" + value + "'>" + value + "</a>";
    } else if (_.isString(value) || _.isNumber(value)) {
      return value;
    } else if (key.indexOf("participant") >= 0) {
      return value.thing + " as " + value.type + " with importance: " + value.importance;
    } else if (key.indexOf("subtype") >= 0) {
      return value.type + " with importance: " + value.importance;
    }
  };
  return function (historyCollection) {
    var html = $(historyTemplate());
    var groupId = 0;
    // var table = html.find("table");
    historyCollection.each(function (change) {
      groupId += 1;
      change = change.toJSON();
      change.date = moment.utc(change.date);
      change.new_values = _.omit(change.new_values, ["id"]);
      var keyValues = getKeyValues(change.new_values);
      keyValues.sort(function (a, b) {
        a = a[0];
        b = b[0];
        if (a === "reason") {
          return -1;
        } else if (b === "reason") {
          return 1;
        }
        else {
          return a < b ? -1 : (a === b ? 0 : 1);
        }
      });
      var body = $("<tbody class='group-" + groupId + "'/>");
      html.append(body);
      body.append($(historyItemTemplate(
        _.extend(change, {
          field: change.type + (change.mode ? (" " + change.mode) : ""),
          value: change.name
        })
      )));
      _.each(keyValues, function (keyValue) {
        var value = getValue(keyValue[0], keyValue[1], change);
        if (value) {
          body.append($(historyItemTemplate(
            _.extend(change, {
              field: keyValue[0].replace("_", " "),
              value: value
            })
          )));
        }
      });
    }, this);
    return html;
  };
});