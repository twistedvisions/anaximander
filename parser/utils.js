var extractName = function (str) {
  return escapeQuote(decodeURIComponent(/.*\/(.*)>$/.exec(str)[1].replace(/_/g, " ")));
};

var escapeQuote = function (str) {
  return str.replace(/\'/g, "''");
};


module.exports = {
  extractName: extractName,
  escapeQuote: escapeQuote
}