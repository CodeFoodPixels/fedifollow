const path = require("path");

module.exports = {
  GET: {
    "/ping": ping,
    "/test": (req, res) => res.end('<script src="/ping.js"></script>'),
    "/api/hits": hits,
    "/api/teapot": teapot,
    "/": (req, res) => res.sendFile(path.join("..", "public", "index.html")),
    "*": staticFile,
  },
};
