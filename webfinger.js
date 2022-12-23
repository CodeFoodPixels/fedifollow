const https = require("https");
const { XMLParser } = require("fast-xml-parser");

const JRD_TYPE = "application/jrd+json";
const XRD_TYPE = "application/xrd+xml";

const URIs = [
  { URI: "webfinger", type: JRD_TYPE },
  { URI: "host-meta.json", type: JRD_TYPE },
  { URI: "host-meta", type: XRD_TYPE },
];

class Webfinger {
  constructor(user) {
    if (!user) {
      throw { message: "NO_USER" };
    }

    if (this.isUrl(user)) {
      const userUrl = new URL(user);
      this.user = {
        host: userUrl.hostname,
        scheme: "https://",
        user: `${userUrl.hostname}${userUrl.pathname}`,
      };
    } else if (user.indexOf("/") > -1 && this.isUrl(`https://${user}`)) {
      const userUrl = new URL(`https://${user}`);
      this.user = {
        host: userUrl.hostname,
        scheme: "https://",
        user: `${userUrl.hostname}${userUrl.pathname}`,
      };
    } else if (user.replace(/^@/, "").split("@").length === 2) {
      const userParts = user.replace(/^@/, "").split("@");
      this.user = {
        host: userParts[1],
        scheme: "acct:",
        user: userParts.join("@"),
      };
    } else {
      throw { message: "INVALID_USER" };
    }
  }

  isUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  async query() {
    for (let i = 0; i < URIs.length; i++) {
      const url = `https://${this.user.host}/.well-known/${
        URIs[i].URI
      }?resource=${this.user.scheme}${encodeURIComponent(this.user.user)}`;

      try {
        const req = await this.makeRequest(url, URIs[i].type);

        return req;
      } catch (e) {
        if (e.message === "REQUEST_ERROR" && e.status === 404) {
          continue;
        }

        throw e;
      }
    }

    throw { message: "REQUEST_ERROR" };
  }

  makeRequest(url, responseType, nested = false) {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400) {
            if (res?.headers?.location) {
              return resolve(this.makeRequest(res.headers.location));
            } else {
              return reject({
                message: "FAILED_REDIRECT",
                status: res.statusCode,
              });
            }
          } else if (res.statusCode !== 200) {
            return reject({ message: "REQUEST_ERROR", status: res.statusCode });
          }

          let data = "";

          res.on("data", (d) => {
            data += d;
          });

          res.on("end", async () => {
            try {
              if (responseType === XRD_TYPE) {
                const jrd = await this.xrdToJrd(data, nested);
                return resolve(jrd);
              }

              resolve(JSON.parse(data));
            } catch (e) {
              reject({ message: "INVALID_DATA_FORMAT" });
            }
          });
        })
        .on("error", (e) => {
          reject({ message: "NETWORK_ERROR" });
        });
    });
  }

  async xrdToJrd(xrd, nested) {
    const XML = new XMLParser({
      ignoreAttributes: false,
      preserveOrder: true,
    });
    const parsed = XML.parse(xrd, true);

    const XRD = parsed.filter((el) => el.hasOwnProperty("XRD"))?.[0].XRD;
    if (!XRD) {
      throw { message: "INVALID_DATA_FORMAT" };
    }

    return await this.processXrdElements(XRD, nested);
  }

  async processXrdElements(elements, nested = false) {
    const output = {
      aliases: [],
      properties: {},
      links: [],
      titles: {},
    };
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

        if (children?.[0]?.["#text"]) {
          output.aliases.push(children[0]["#text"]);
        }
      } else if (elements[i].hasOwnProperty("Property")) {
        const children = elements[i].Property;
        const attributes = elements[i][":@"];

        if (attributes?.["@_type"])
          output.properties[attributes["@_type"]] =
            children?.[0]?.["#text"].toString() || null;
      } else if (elements[i].hasOwnProperty("Link")) {
        const children = elements[i].Link;
        const attributes = elements[i][":@"];

        if (attributes?.["@_rel"].toLowerCase() === "lrdd") {
          if (!attributes?.["@_template"] || nested) {
            continue;
          }

          const lrdd = await this.makeRequest(
            attributes["@_template"].replace(
              "{uri}",
              `${this.user.scheme}${this.user.user}`
            ),
            attributes["@_type"].toLowerCase() || XRD_TYPE,
            true
          );

          if (lrdd.subject) {
            output.subject = lrdd.subject;
          }

          if (lrdd.aliases) {
            output.aliases.push(...lrdd.aliases);
          }

          if (lrdd.properties) {
            Object.keys(lrdd.properties).forEach((key) => {
              output.properties[key] = lrdd.properties[key];
            });
          }

          if (lrdd.links) {
            output.links.push(...lrdd.links);
          }
        }
        const link =
          children.length > 0 ? this.processXrdElements(children) : {};

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
}

module.exports = Webfinger;
