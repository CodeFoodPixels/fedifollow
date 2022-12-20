const activityPubProfile = require("../activityPubProfile");
const webfinger = require("../webfinger");
const handleError = require("./error");

module.exports = function follow(server) {
  async function followPage(req, res, template) {
    const toFollow = req.requestUrl.searchParams.get("account");

    try {
      if (!toFollow) {
        throw { message: "NO_USER" };
      }

      const user = await webfinger(toFollow);
      const canonical = user?.links?.find(
        (link) => link.type === "application/activity+json"
      )?.href;

      const profile = await activityPubProfile(canonical);

      const image = profile?.image?.url || "";
      const icon = profile?.icon?.url || "";

      const profileUrl = new URL(profile.url);
      const server = profileUrl.hostname;
      const displayHandle = `${profileUrl.hostname}${profileUrl.pathname}`;

      const follower = req.cookies.account || "";
      const remember = !!req.cookies.account;

      return res.render(
        template,
        {
          toFollow,
          follower,
          remember,
          url: profileUrl.toString(),
          name: profile.name,
          displayHandle,
          server,
          image,
          icon,
          title: `Follow ${profile.name} (${displayHandle})`,
        },
        "layout.njk"
      );
    } catch (e) {
      handleError(e.message, toFollow, res);
    }
  }

  server.get("/follow", (req, res) => {
    followPage(req, res, "follow.njk");
  });

  server.post("/follow", async (req, res) => {
    const body = req.body;
    try {
      const user = await webfinger(body.follower);
      const template = user?.links?.find(
        (link) => link.rel === "http://ostatus.org/schema/1.0/subscribe"
      )?.template;

      if (template) {
        if (body.remember) {
          res.setHeader(
            "Set-Cookie",
            `account=${body.follower}; Max-Age=34560000; secure; HttpOnly;`
          );
        }
        res.setHeader(
          "Location",
          template.replace("{uri}", encodeURIComponent(body.toFollow))
        );
      } else {
        res.setHeader("Location", `/manual-follow?account=${body.toFollow}`);
      }

      res.statusCode = 303;
      res.end();
    } catch (e) {
      handleError(e.message, body.follower, res);
    }
  });

  server.get("/manual-follow", (req, res) => {
    followPage(req, res, "manual-follow.njk");
  });
};
