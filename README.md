<p>&nbsp;</p>
<p align="center">
<img src="http://i.imgur.com/BRdEVYW.png" width="150px" />
</p>
<p>&nbsp;</p>

Recon
=====

Code Intelligence for React Applications.

[![Build Status](https://travis-ci.org/lystable/recon.svg?branch=master)](https://travis-ci.org/lystable/recon)

### What?

Recon provides a new level of insight into your codebase allowing you to understand
how your components are being used, easily grep their complexity, draw dependency graphs,
and isolate points for optimisation.

On top of this the raw information Recon provides gives a strong base for creating tools
(such as living styleguides) which may need to plug in to component meta data.

### How?

The core of Recon revolves around `recon-engine`. This engine parses your application pulling out
any data which may be useful (eg. Props, component dependencies, enhancements etc.). Then a
graphql query interface is exposed allowing you to explore your applications in an incredibly
intuitive manner!

Checking out our [test fixtures](./packages/recon-engine/src/engine/__fixtures__/) is a
great place to an example of this.

Once this data is consolidated the possibility of tools to be built on top are *endless*!

Getting Started
---------------

Prerequisites: `Node >v6`. Also ensure using `import/export` syntax, using JSX (see roadmap for full list)

### Install and configuration

The quickest way to get going with Recon for your project is to use our CLI application.

Firstly install with

```
$ npm install -g recon-cli
```

Now, within your application working directory, simply run

```
$ recon
```

You are now *inside* Recon! :O

From this point forwards the entire power of Recon should be just a `help` command away.

```
recon$ help
```

The first thing you're going to want to do from here is create a new config file `.reconrc` in the working directory
of your project.

You can do this interactively by running

```
recon$ init
```

*To view all configuration possibilities you can view the docs [here](./packages/recon-config/README.md).*

### Show me the power!

Why not start off by trying `stats`. This will analyse your application and dump out a bunch of objective
statements and statistics.

```
recon$ stats
```

Then if you're feeling *extra* adventurous give `server` a go. This will spawn a new `graphql` server which will
allow you to query your application meta data freely.

```
recon$ server
```

For everything else see what is available via the `help` command!

### I want to integrate Recon into x

Documentation is going to be a little skimpy here for a while since we are planning on getting
the internals of `recon-engine` to be as powerful as possible and stabilising the api as much as
possible.

Most likely you'll want to look at using `recon-engine` and `recon-server` (their tests are a decent
place to start looking).

> Disclaimer: This is a very early preview of Recon and you should expect breaking changes within the <v1 range of releases.

Contributing
------------

- Bugs? Please submit a *Pull Request* with your minimal source code and a test which breaks.
- Want to fix something or add a new feature? Get started with our [Dev Guide](./docs/dev-guide.md)!

For more details on all contributions see [CONTRIBUTING.md](./CONTRIBUTING.md)

High-level Roadmap
------------------

- [ ] Move CLI away from vorpal to a non-interactive version
  - [ ] The engine should be spawned in the background. Ie. similar to flow server
- [ ] Identify initial parsing issues across many codebases
  - [ ] Improve test `.toMatch` to not care about ordering (ie. add `toMatchUnordered`)
  - [ ] Provide better DX for dumping debug data and reporting issues
- [ ] Pull prop type definitions from components
- [ ] Broader React usage support
  - [ ] React.createClass, React.createElement, hyperscript
  - [ ] Support decorator syntax as enhancements
  - [ ] Support `require('module')`
- [ ] Better prop usage information
  - [ ] Pull out static values (eg. prop="stringValue")
  - [ ] Resolve basic flows to determine *possible* values (upto prop types)
  - [ ] Resolve rest/spread props
- [ ] More trivial meta data! (eg. docblocks)
- [ ] Stabilise graphql interface
- [ ] Support long-running persisted engine (ie. watch file changes)
- [ ] Work on documentation and integrations for developer tools
- [ ] Explore plugin api
- [ ] Reassess and tidy implementation
  - [ ] Performance optimisations
- [ ] Identify application critical paths
- [ ] Explore using Flow for internal type resolution

License
-------

Apache 2.0
