const http = require("http");
const path = require("path");
const fs = require("fs").promises;
const mime = require("mime-types");
const nunjucks = require("nunjucks");

nunjucks.configure(path.join(__dirname, "..", "pages"), {
  noCache: process.env.dev ? true : false,
});

class Response extends http.ServerResponse {
  constructor() {
    super(...arguments);
  }

  async sendFile(filePath) {
    const extname = path.extname(filePath);

    try {
      let content = await fs.readFile(filePath);

      this.setHeader("Content-Type", mime.lookup(extname));
      this.end(content);
    } catch (error) {
      if (error.code === "ENOENT") {
        this.statusCode = 404;
        this.setHeader("Content-Type", "text/html");

        return this.end("Not found");
      }
      this.statusCode = 500;
      this.setHeader("Content-Type", "text/html");
      return this.end("Server error");
    }
  }

  sendJSON(data) {
    if (typeof data === "object") {
      this.setHeader("Content-Type", "application/json");
      this.end(JSON.stringify(data));
    } else {
      this.setHeader("Content-Type", "text/html");
      this.end(data);
    }
  }

  render(template, locals = {}, layout) {
    let rendered = nunjucks.render(template, locals);

    if (layout) {
      rendered = nunjucks.render(layout, { ...locals, content: rendered });
    }

    this.setHeader("Content-Type", "text/html");
    this.end(rendered);
  }
}

module.exports = Response;
