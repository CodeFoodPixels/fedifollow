const https = require("https");

module.exports = function webfinger(user) {
  const httpsUser = user.indexOf("://") > -1;
  user = user.replace(/^@/, "");

  const host = httpsUser
    ? user.split("/")[2]
    : user.replace(/^@/, "").split("@")[1];

  const userScheme = httpsUser ? "" : "acct:";
  const url = `https://${host}/.well-known/webfinger?resource=${userScheme}${user}`;

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        console.log("statusCode:", res.statusCode);
        console.log("headers:", res.headers);

        res.on("data", (d) => {
          data += d;
        });

        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject();
          }
        });
      })
      .on("error", (e) => {
        console.error(e);
      });
  });
};
