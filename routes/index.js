const path = require("path");

module.exports = (server) => {
  server.get("/", (req, res) => {
    console.log(path.join("..", "public", "index.html"));
    res.sendFile(path.join("..", "public", "index.html"));
  });
};
