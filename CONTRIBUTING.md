Contributing Guidelines
=======================

## Got a bug when using Recon against your application source code?

The nature of Recon and flexibility of Javascript means it is very hard to gather
all the edge cases for usage of React. Therefore the best way for us to debug
and resolve issues is to have a reproducible breaking test case which demonstrates
your usage.

We therefore ask if you have an issue with the parsing or output of Recon to please
submit a pull request with the following:

- A test case which demonstrates the code which breaks/doesn't do what you expect.
  - In most cases this will be as simple as copying out a fixture and hooking up a new test
   which will most likely live either [here](../packages/recon-engine/src/engine/__tests__) or [here](../packages/recon-engine/src/parse/__tests__)
- Title prefixed with `[BUG]`

## Got a feature idea?

We'd love to discuss it! Feel free to submit an issue. Just try to be as descriptive as you can
and preferably include code/output examples since that can really help.

## Developing Recon

Read more about contributing to the codebase in our [Developer Guide](./docs/dev-guide.md)

At an absolute minimum make sure `npm test` runs! :)
