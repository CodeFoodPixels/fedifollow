const path = require("path");
const follow = require("./follow");

module.exports = (server) => {
  server.get("/", (req, res) => {
    res.render("index.njk", {}, "layout.njk");
  });

  server.use(follow);

  server.static("/public", path.join(__dirname, "..", "public"));
};
