const http = require("http");

class Request extends http.IncomingMessage {
  constructor() {
    super(...arguments);
    this.body = "";
  }
  get requestUrl() {
    const secure =
      this.socket?.encrypted || this.headers?.["x-forwarded-proto"] === "https";
    return new URL(req.url, `http${secure ? "s" : ""}://${this.headers.host}`);
  }
}

module.exports = Request;
