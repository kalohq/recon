const express = require('express');
const graphqlHTTP = require('express-graphql');
const http = require('http');

/** Given a recon engine create a http-server for querying */
function createServer(engine, {port = 4000} = {}) {
  const app = express();

  app.use(
    '/graphql',
    graphqlHTTP({
      schema: engine.schema,
      graphiql: true,
    })
  );

  const server = http.createServer(app);

  return new Promise(accept => {
    server.listen(port, () => {
      accept(server);
    });
  });
}

module.exports = createServer;
