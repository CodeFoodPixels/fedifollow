const https = require("https");

async function activityPubProfile(url) {
  if (!url) {
    throw { message: "NO_URL" };
  }

  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: "application/activity+json" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400) {
          if (res?.headers?.location) {
            return resolve(activityPubProfile(res.headers.location));
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

module.exports = activityPubProfile;
