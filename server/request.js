const http = require("http");

class Request extends http.IncomingMessage {
  constructor() {
    super(...arguments);
    this.body = "";
  }
  get requestUrl() {
    return new URL(getRequestURL(this));
  }
}

function getRequestURL(req) {
  var secure =
    req.socket?.encrypted || req.headers?.["x-forwarded-proto"] === "https";
  return `http${secure ? "s" : ""}://${req.headers.host}${req.url}`;
}

module.exports = Request;
