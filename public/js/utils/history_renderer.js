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
  return function (historyCollection) {
    var html = $(historyTemplate());
    var groupId = 0;
    // var table = html.find("table");
    historyCollection.each(function (change) {
      groupId += 1;
      change = change.toJSON();
      change.date = moment.utc(change.date);
      change.new_values = _.omit(change.new_values, ["id"]);
      var keys = _.keys(change.new_values);
      var first = _.first(keys);
      var body = $("<tbody class='group-" + groupId + "'/>");
      html.append(body);
      body.append($(historyItemTemplate(
        _.extend(change, {
          field: first,
          value: change.new_values[first]
        })
      )));
      _.each(_.rest(keys), function (key) {
        body.append($(historyItemTemplate(
          _.extend(change, {
            field: key,
            value: change.new_values[key]
          })
        )));
      });
    }, this);
    return html;
  };
});