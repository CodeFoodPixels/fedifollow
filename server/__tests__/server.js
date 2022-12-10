const EventEmitter = require("events");
const { readFile } = require("fs");
const Request = require("../request");
const Response = require("../response");

function generateReqRes(reqProps = {}, resProps = {}) {
  class reqClass extends EventEmitter {
    constructor() {
      super();

      this.method = "GET";
      this.url = "/test";
      this.body = "";
    }
    get requestUrl() {
      return new URL(`https://lukeb.co.uk${this.url}`);
    }
  }

  const req = new reqClass();

  Object.keys(reqProps).forEach(key => {
    req[key] = reqProps[key];
  });

  const res = { setHeader: jest.fn(), writeHead: jest.fn(), end: jest.fn() };
  Object.keys(resProps).forEach(key => {
    res[key] = resProps[key];
  });

  return [req, res];
}

describe("server", () => {
  beforeEach(() => {
    jest.disableAutomock();
    jest.resetModules();
  });

  it("calls the correct route", () => {
    const mockServer = new EventEmitter();
    const mockHandler = jest.fn((req, res) => {
      res.end();
    });
    const [req, res] = generateReqRes();

    const http = require("http");
    http.createServer = jest.fn().mockImplementation(() => mockServer);

    jest.mock("../routes", () => {
      return {
        GET: {
          "/test": mockHandler
        }
      };
    });

    require("../server");

    mockServer.emit("request", req, res);
    req.emit("end");

    expect(mockHandler).toBeCalled();
    expect(mockHandler.mock.lastCall[0].body).toBe("");
    expect(mockHandler.mock.lastCall[1].end).toBeCalled();
    expect(mockHandler.mock.lastCall[1].setHeader).toBeCalledWith(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    expect(mockHandler.mock.lastCall[1].setHeader).toBeCalledWith(
      "Expires",
      "-1"
    );
    expect(mockHandler.mock.lastCall[1].setHeader).toBeCalledWith(
      "Pragma",
      "no-cache"
    );
  });

  it("calls the default route", () => {
    const mockServer = new EventEmitter();
    const mockHandler = jest.fn((req, res) => {
      res.end();
    });
    const [req, res] = generateReqRes();

    const http = require("http");
    http.createServer = jest.fn().mockImplementation(() => mockServer);

    jest.mock("../routes", () => {
      return {
        GET: {
          "*": mockHandler
        }
      };
    });

    require("../server");

    mockServer.emit("request", req, res);
    req.emit("end");

    expect(mockHandler).toBeCalled();
    expect(mockHandler.mock.lastCall[0].body).toBe("");
    expect(mockHandler.mock.lastCall[1].end).toBeCalled();
  });

  it("returns a 404", () => {
    const mockServer = new EventEmitter();
    const [req, res] = generateReqRes();

    const http = require("http");
    http.createServer = jest.fn().mockImplementation(() => mockServer);

    jest.mock("../routes", () => {
      return {};
    });

    require("../server");

    mockServer.emit("request", req, res);
    req.emit("end");

    expect(req.body).toBe("");
    expect(res.statusCode).toBe(404);
    expect(res.end).toBeCalledWith("Not found");
  });

  it("calls the correct route with a body", () => {
    const mockServer = new EventEmitter();
    const mockHandler = jest.fn((req, res) => {
      res.end();
    });
    const [req, res] = generateReqRes();

    const http = require("http");
    http.createServer = jest.fn().mockImplementation(() => mockServer);

    jest.mock("../routes", () => {
      return {
        GET: {
          "/test": mockHandler
        }
      };
    });

    require("../server");

    mockServer.emit("request", req, res);
    req.emit("data", "Hello ");
    req.emit("data", "world!");
    req.emit("end");

    expect(mockHandler).toBeCalled();
    expect(mockHandler.mock.lastCall[0].body).toBe("Hello world!");
    expect(mockHandler.mock.lastCall[1].end).toBeCalled();
  });

  it("calls the correct route when the URL is the root domain", () => {
    const mockServer = new EventEmitter();
    const mockHandler = jest.fn((req, res) => {
      res.end();
    });
    const [req, res] = generateReqRes({ url: "/" });

    const http = require("http");
    http.createServer = jest.fn().mockImplementation(() => mockServer);

    jest.mock("../routes", () => {
      return {
        GET: {
          "/": mockHandler
        }
      };
    });

    require("../server");

    mockServer.emit("request", req, res);
    req.emit("data", "Hello ");
    req.emit("data", "world!");
    req.emit("end");

    expect(mockHandler).toBeCalled();
    expect(mockHandler.mock.lastCall[0].body).toBe("Hello world!");
    expect(mockHandler.mock.lastCall[1].end).toBeCalled();
  });
});
