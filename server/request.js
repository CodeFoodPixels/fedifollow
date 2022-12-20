const http = require("http");

class Request extends http.IncomingMessage {
  constructor() {
    super(...arguments);
    this.body = "";
  }
  get requestUrl() {
    const secure =
      this.socket?.encrypted || this.headers?.["x-forwarded-proto"] === "https";
    return new URL(this.url, `http${secure ? "s" : ""}://${this.headers.host}`);
  }
  get cookies() {
    return Object.fromEntries(
      this.headers?.cookie?.split("; ").map((v) => v.split(/=(.+)/)) || []
    );
  }
  parseBody() {
    if (
      this.headers?.["content-type"] === "application/x-www-form-urlencoded"
    ) {
      this.body = Object.fromEntries(new URLSearchParams(this.body));
    } else if (this.headers?.["content-type"] === "application/json") {
      this.body = JSON.parse(this.body);
    }
  }
}

module.exports = Request;
