Recon Developer Guide
=====================

The first thing to get to grips with is that Recon is structured as a monorepo
and contains several packages. These are:

- [recon-engine](../packages/recon-engine) - The powerhouse behind Recon. Parses, structures and provides a query interface.
- [recon-server](../packages/recon-server) - A simple http server which spawns the engine and provides a http graphql interface.
- [recon-cli](../packages/recon-cli) - Command line interface for quickly working with Recon as opposed to using the programmatic api's.
- [recon-config](../packages/recon-config) - Recon configuration management (reads .rc file etc.)
- [recon-stats](../packages/recon-stats) - Generate useful and interesting stats about an application

## The code

- `npm test` will tell you what's up (type checking, linter ([eslint-config-lystable](https://github.com/lystable/guidelines/tree/master/styleguides/eslint-config-lystable)) and unit tests)

## Let's get going!

Depending on where you're wanting to start you may be interested in the more targeted
developer guides:

- [recon-engine Developer Guide](../packages/recon-engine/docs/dev-guide.md)
