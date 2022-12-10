const request = require("../request");

describe("request", () => {
  it("returns a non-secure URL", () => {
    const req = new request();

    req.url = "/test";
    req.socket = { encrypted: false };
    req.headers.host = "lukeb.co.uk";

    expect(req.requestUrl).toEqual(new URL("http://lukeb.co.uk/test"));
  });

  it("returns a secure URL", () => {
    const req = new request();

    req.url = "/test";
    req.socket = { encrypted: true };
    req.headers.host = "lukeb.co.uk";

    expect(req.requestUrl).toEqual(new URL("https://lukeb.co.uk/test"));
  });

  it("returns a secure URL", () => {
    const req = new request();

    req.url = "/test";
    req.headers.host = "lukeb.co.uk";
    req.headers["x-forwarded-proto"] = "https";

    expect(req.requestUrl).toEqual(new URL("https://lukeb.co.uk/test"));
  });
});
