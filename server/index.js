const http = require("http");
const { normalize } = require("path");
const path = require("path");
const request = require("./request");
const response = require("./response");

function createServer() {
  const routes = {
    GET: {},
    POST: {},
  };

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
      req.body += chunk.toString();
    });
    req.on("end", async () => {
      req.parseBody();

      const pathParts = pathName.split("/");

      let currPath = routes[req.method.toUpperCase()];

      if (!currPath && req.method.toUpperCase() === "HEAD") {
        currPath = routes["GET"];
      } else if (!currPath) {
        return notFound(res);
      }

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
        }

        notFound(res);
        break;
      }
    });
  });

  function notFound(res) {
    res.statusCode = 404;
    res.render("404.njk", { title: "Not found" }, "layout.njk");
  }

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

    addRoute("GET", `/${cleanedRoute}/*`, (req, res) => {
      const replacePattern = new RegExp(`^/${cleanedRoute}/`);

      const pathName = path.join(
        staticPath,
        ...req.requestUrl.pathname.replace(replacePattern, "").split("/")
      );

      res.sendFile(pathName);
    });
  }

  const methods = {
    listen: server.listen.bind(server),
    get: addRoute.bind(undefined, "GET"),
    post: addRoute.bind(undefined, "POST"),
    route: addRoute,
    static: addStaticRoute,
    use: (cb) => cb(methods),
  };

  return methods;
}

module.exports = createServer;
