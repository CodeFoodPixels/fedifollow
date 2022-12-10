const http = require("http");
const path = require("path");
const request = require("./request");
const response = require("./response");

function removeTrailingSlashes(str) {
  if (typeof str !== "string") {
    return str;
  }

  let i = str.length;
  while (str[--i] === "/");
  return str.slice(0, i + 1);
}

function cleanRoute(route) {
  return removeTrailingSlashes(route).replace(/^\//, "");
}

function createServer() {
  const routes = {
    GET: {},
    POST: {},
  };

  const server = http.createServer({
    IncomingMessage: request,
    ServerResponse: response,
  });

  server.on("request", (req, res) => {
    res.setHeader(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    res.setHeader("Expires", "-1");
    res.setHeader("Pragma", "no-cache");

    const pathName = cleanRoute(req.requestUrl.pathname);

    req.on("data", (chunk) => {
      req.body += chunk.toString(); // convert Buffer to string
    });
    req.on("end", async () => {
      const pathParts = pathName.split("/");

      let currPath = routes[req.method.toUpperCase()];
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (currPath[`/${part}`] && i < pathParts.length - 1) {
          currPath = currPath[`/${part}`];
          continue;
        }

        if (
          currPath[`/${part}`] &&
          i === pathParts.length - 1 &&
          currPath[`/${part}`].handler
        ) {
          await currPath[`/${part}`].handler(req, res);
          break;
        }

        if (currPath["/*"]) {
          await currPath["/*"].handler(req, res);
          break;
        } else {
          res.statusCode = 404;
          res.end("Not found");
        }
        break;
      }
    });
  });

  function addRoute(method, route, handler) {
    const cleanedRoute = cleanRoute(route);
    const routeParts = cleanedRoute.split("/");
    let currPath = routes[method.toUpperCase()];
    routeParts.forEach((part, i) => {
      if (!currPath[`/${part}`]) {
        currPath[`/${part}`] = {};
      }
      currPath = currPath[`/${part}`];
      if (i === routeParts.length - 1) {
        currPath.handler = handler;
      }
    });
  }

  function addStaticRoute(route, staticPath) {
    const cleanedRoute = cleanRoute(route);

    addRoute("GET", `${cleanedRoute}/*`, (req, res) => {
      const replacePattern = new RegExp(`^${cleanedRoute}/`);

      const pathName = path.join(
        staticPath,
        ...req.requestUrl.pathname.replace(replacePattern, "").split("/")
      );
      debugger;
      res.sendFile(pathName);
    });
  }

  return {
    listen: server.listen.bind(server),
    get: addRoute.bind(undefined, "GET"),
    post: addRoute.bind(undefined, "POST"),
    static: addStaticRoute,
  };
}

module.exports = createServer;
