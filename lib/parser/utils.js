var winston = require("winston");

var escapeQuote = function (str) {
  return str.replace(/\'/g, "''");
};

var extractName = function (str) {
  try {
    return escapeQuote(decodeURIComponent(/.*\/(.*)>$/.exec(str)[1].replace(/_/g, " ")));
  } catch (e) {
    winston.error("failed to extract name from", str);
    throw e;
  }
};

var tidyLine = function (line) {
  var re = /\"(.*?)\"/g;
  var match;
  while (!!(match = re.exec(line))) {
    var m = match[1];
    line = line.replace("\"" + m + "\"", "\"" + m.replace(/ /g, "_") + "\"");
  }
  return line;
};


var unescapeUnicode = function (x) {
  var r = /\\u([\d\w]{4})/gi;
  x = x.replace(r, function (match, grp) {
    return String.fromCharCode(parseInt(grp, 16));
  });
  return unescape(x);
};

var getError = function (e, job) {
  return {
    error: {message: e.message, stack: e.stack},
    job: job && job.value
  };
};

module.exports = {
  extractName: extractName,
  escapeQuote: escapeQuote,
  tidyLine: tidyLine,
  unescapeUnicode: unescapeUnicode,
  getError: getError
};