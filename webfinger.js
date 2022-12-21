const https = require("https");
const { XMLParser } = require("fast-xml-parser");

const URIs = [
  { URI: "webfinger", type: "JSON" },
  { URI: "host-meta.json", type: "JSON" },
  { URI: "host-meta", type: "XML" },
];
function isUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

function processUser(user) {
  if (isUrl(user)) {
    const userUrl = new URL(user);
    return {
      host: userUrl.hostname,
      scheme: "https://",
      user: `${userUrl.hostname}${userUrl.pathname}`,
    };
  } else if (user.indexOf("/") > -1 && isUrl(`https://${user}`)) {
    const userUrl = new URL(`https://${user}`);
    return {
      host: userUrl.hostname,
      scheme: "https://",
      user: `${userUrl.hostname}${userUrl.pathname}`,
    };
  } else if (user.replace(/^@/, "").split("@").length === 2) {
    const userParts = user.replace(/^@/, "").split("@");
    return {
      host: userParts[1],
      scheme: "acct:",
      user: userParts.join("@"),
    };
  }

  throw { message: "INVALID_USER" };
}

async function webfinger(user) {
  if (!user) {
    throw { message: "NO_USER" };
  }

  const processedUser = processUser(user);
  for (let i = 0; i < URIs.length; i++) {
    const url = `https://${processedUser.host}/.well-known/${
      URIs[i].URI
    }?resource=${processedUser.scheme}${encodeURIComponent(
      processedUser.user
    )}`;

    try {
      const req = await makeRequest(url, URIs[i].type);

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

function makeRequest(url, responseType) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400) {
          if (res?.headers?.location) {
            return resolve(makeRequest(res.headers.location));
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

        res.on("end", () => {
          try {
            if (responseType === "JSON") {
              resolve(JSON.parse(data));
            } else {
              const XML = new XMLParser({
                ignoreAttributes: false,
                preserveOrder: true,
              });
              console.log(XML.parse(data, true));
              resolve(XML.parse(data, true));
            }
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

module.exports = webfinger;
