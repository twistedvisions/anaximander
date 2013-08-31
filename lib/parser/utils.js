var escapeQuote = function (str) {
  return str.replace(/\'/g, "''");
};

var extractName = function (str) {
  try {
    return escapeQuote(decodeURIComponent(/.*\/(.*)>$/.exec(str)[1].replace(/_/g, " ")));
  } catch (e) {
    console.log("failed to extract name from", str);
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


module.exports = {
  extractName: extractName,
  escapeQuote: escapeQuote,
  tidyLine: tidyLine
};