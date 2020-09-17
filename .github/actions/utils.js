exports.removeSpaces = text => text.replace(/ {2,}/gm, "");

exports.stribEmptyLines = text => text.replace(/^\s*[\r\n]/gm, "");

exports.platformSupport = text => platform => text.toLowerCase().replace(/\s/g, "").indexOf(`[x]${platform}`) !== -1;

exports.capitalise = text => {
  return text.toLowerCase().replace(
    /(?:^|\s|["'([{])+\S/g, 
    match => match.toUpperCase()
  );
};

exports.branchify = text => text.replace(/( )/g, "");

exports.getSection = text => (from, to = "") => {
  const start = text.indexOf(from) + from.length;
  return to === ""
    ? text.substring(start).trim()
    : text.substring(start, text.indexOf(to)).trim();
}

exports.getPlaygroundLink = string => {
  const exp = new RegExp(/(play.nativescript.org\/\?template\=play-(?:js|tsc|ng|react|vue|svelte)\&id\=(?:\w)+(?:\&v\=(?:\d)+)?)|[^]/, "g");
  const link = string.replace(exp, "$1");
  return link.startsWith("https://") ? link : `https://${link}`;
}

exports.validatePlaygroundLink = url => {
  const exp = new RegExp(/^(?:https\:\/\/)?play\.nativescript\.org\/\?template\=play\-(?:js|tsc|ng|react|vue|svelte)\&id\=(?:\w)+(?:\&v\=(?:\d)+)?$/);
  return exp.test(url);
}

exports.dateString = created => {
  // "2020-09-02T"
  const data = created.substring(0, created.indexOf("T")).split("-");
  const date = new Date(data[0], data[1] - 1, data[2]);
  return date.toLocaleDateString(
    "en-AU", 
    { day: "numeric", month: "short", year: "numeric"}
  );
}

exports.stripComments = function stripComments(text) {
  let string = text;
  const openIndex = text.indexOf("<!--");
  const closeIndex = text.indexOf("-->", openIndex);
  const hasComment = openIndex !== -1 && closeIndex !== -1;
  
  if (hasComment) {
    string = text.substring(0, openIndex) + "" + text.substring(closeIndex+3);
    return stripComments(string);
  }
  
  return string;
}