const response = require("../response");
describe("response", () => {
  it("sendJSON returns JSON", () => {
    const res = new response({});
    const endSpy = jest.spyOn(res, "end");
    const setHeaderSpy = jest.spyOn(res, "setHeader");

    res.sendJSON({ test: "hello" });

    expect(setHeaderSpy).toBeCalledWith("Content-Type", "application/json");
    expect(endSpy).toBeCalledWith('{"test":"hello"}');
  });

  it("sendJSON just calls end with content if not an object", () => {
    const res = new response({});
    const endSpy = jest.spyOn(res, "end");
    const setHeaderSpy = jest.spyOn(res, "setHeader");

    res.sendJSON("hello");

    expect(setHeaderSpy).toBeCalledWith("Content-Type", "text/html");
    expect(endSpy).toBeCalledWith("hello");
  });

  it("sendFile should return file contents and correct header", async () => {
    const fs = require("fs");
    const res = new response({});
    const endSpy = jest.spyOn(res, "end");
    const setHeaderSpy = jest.spyOn(res, "setHeader");

    fs.promises.readFile = jest.fn(() => {
      return Promise.resolve("Test JPG File");
    });

    await res.sendFile("file/cheese.jpg");

    expect(setHeaderSpy).toBeCalledWith("Content-Type", "image/jpeg");
    expect(res.statusCode).toBe(200);
    expect(endSpy).toBeCalledWith("Test JPG File");
  });

  it("sendFile should return a 404 if file isn't found", async () => {
    const fs = require("fs");
    const res = new response({});
    const endSpy = jest.spyOn(res, "end");
    const setHeaderSpy = jest.spyOn(res, "setHeader");

    fs.promises.readFile = jest.fn(() => {
      const err = new Error();
      err.code = "ENOENT";
      return Promise.reject(err);
    });

    await res.sendFile("file/cheese.jpg");

    expect(setHeaderSpy).toBeCalledWith("Content-Type", "text/html");
    expect(res.statusCode).toBe(404);
    expect(endSpy).toBeCalledWith("Not found");
  });

  it("sendFile should return a 500 if there are other errors", async () => {
    const fs = require("fs");
    const res = new response({});
    const endSpy = jest.spyOn(res, "end");
    const setHeaderSpy = jest.spyOn(res, "setHeader");

    fs.promises.readFile = jest.fn(() => {
      const err = new Error();
      return Promise.reject(err);
    });

    await res.sendFile("file/cheese.jpg");

    expect(setHeaderSpy).toBeCalledWith("Content-Type", "text/html");
    expect(res.statusCode).toBe(500);
    expect(endSpy).toBeCalledWith("Server error");
  });
});
