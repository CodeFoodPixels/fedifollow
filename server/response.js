const http = require("http");
const path = require("path");
const mime = require("mime-types");
const fs = require("fs").promises;

class Response extends http.ServerResponse {
  constructor() {
    super(...arguments);
  }

  async sendFile(filePath) {
    const realPath = path.join(__dirname, filePath);
    const extname = path.extname(realPath);

    try {
      const content = await fs.readFile(realPath);
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
}

module.exports = Response;
