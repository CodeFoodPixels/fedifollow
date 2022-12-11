const server = require("./server")();
const routes = require("./routes");
const port = process.env.PORT || 8080;

server.use(routes);

server.listen(port, () => {
  console.log(`Fedifollow is listening on port ${port}`);
});
