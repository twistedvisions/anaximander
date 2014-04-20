var hasEmail = function (obj) {
  return obj.emails && obj.emails[0] &&
    obj.emails[0].value && obj.emails[0].value.length > 3;
};

module.exports = function (type, obj) {
  var username = type + ":";

  if (obj.username) {

    username = username + obj.username;

  } else if (hasEmail(obj)) {

    username = username + obj.emails[0].value;

  } else if (obj.name) {

    var extraName = false;
    if (obj.name.givenName) {
      username += obj.name.givenName;
      extraName = true;
    }
    if (obj.name.familyName) {
      if (extraName) {
        username += "_";
      }
      username += obj.name.familyName;
      extraName = true;
    }
    if (!extraName) {
      username += obj.name.replace(/\s+/g, "_");
    }

  } else {

    username = username + (Math.random() * 100000000).toFixed(0);

  }

  obj.username = username;

};