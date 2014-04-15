define([
  "jquery",
  "underscore",
  "moment",
  "text!templates/event_history.htm",
  "text!templates/event_history_item.htm",
  "css!/css/changes.css"
], function ($, _, moment, historyTemplate, historyItemTemplate) {
  historyTemplate = _.template(historyTemplate);
  historyItemTemplate = _.template(historyItemTemplate);

  var getKeyValues = function (values) {
    var keyValues = [];
    _.chain(values)
      .omit(["newParticipants", "editedParticipants", "removedParticipants"])
      .keys()
      .each(function (key) {
        keyValues.push([key, values[key]]);
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
    return keyValues;
  };
  var getValue = function (value) {
    if (_.isString(value)) {
      return value;
    } else {
      return value.thing + " as " + value.type + " with importance: " + value.importance;
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
      var first = _.first(keyValues);
      var body = $("<tbody class='group-" + groupId + "'/>");
      html.append(body);
      body.append($(historyItemTemplate(
        _.extend(change, {
          field: first[0],
          value: getValue(first[1])
        })
      )));
      _.each(_.rest(keyValues), function (keyValue) {
        body.append($(historyItemTemplate(
          _.extend(change, {
            field: keyValue[0],
            value: getValue(keyValue[1])
          })
        )));
      });
    }, this);
    return html;
  };
});