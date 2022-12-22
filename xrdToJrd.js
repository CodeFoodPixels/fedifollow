const { XMLParser } = require("fast-xml-parser");

function xrdToJrd(xrd) {
  const XML = new XMLParser({
    ignoreAttributes: false,
    preserveOrder: true,
  });
  const parsed = XML.parse(xrd, true);

  const XRD = parsed.filter((el) => el.hasOwnProperty("XRD"))?.[0].XRD;
  if (!XRD) {
    throw { message: "INVALID_DATA_FORMAT" };
  }

  return processElements(XRD);
}

function processElements(elements) {
  const output = {};
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].hasOwnProperty("Subject")) {
      const children = elements[i].Subject;
      if (children?.[0]?.["#text"]) {
        output.subject = children?.[0]?.["#text"];
      }
    } else if (elements[i].hasOwnProperty("Expires")) {
      const children = elements[i].Expires;
      if (children?.[0]?.["#text"]) {
        output.expires = children?.[0]?.["#text"];
      }
    } else if (elements[i].hasOwnProperty("Alias")) {
      const children = elements[i].Alias;

      if (!output.aliases) {
        output.aliases = [];
      }
      if (children?.[0]?.["#text"]) {
        output.aliases.push(children[0]["#text"]);
      }
    } else if (elements[i].hasOwnProperty("Property")) {
      const children = elements[i].Property;
      const attributes = elements[i][":@"];

      if (!output.properties) {
        output.properties = {};
      }

      if (attributes?.["@_type"])
        output.properties[attributes["@_type"]] =
          children?.[0]?.["#text"].toString() || null;
    } else if (elements[i].hasOwnProperty("Link")) {
      const children = elements[i].Link;
      const attributes = elements[i][":@"];

      if (!output.links) {
        output.links = [];
      }

      const link = children.length > 0 ? processElements(children) : {};

      Object.keys(attributes).forEach((key) => {
        link[key.slice(2)] = attributes[key];
      });

      if (Object.keys(link).length > 0) {
        output.links.push(link);
      }
    } else if (elements[i].hasOwnProperty("Title")) {
      const children = elements[i].Title;
      const attributes = elements[i][":@"];

      if (!output.titles) {
        output.titles = {};
      }

      if (children?.[0]?.["#text"]) {
        const key = attributes?.["@_xml:lang"] || "default";

        output.titles[key] = children[0]["#text"].toString();
      }
    }
  }

  return output;
}

module.exports = xrdToJrd;
