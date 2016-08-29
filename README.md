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

#### How?

The core of Recon revolves around `recon-engine`. This engine parses your application pulling out
any data which may be useful (eg. Props, component dependencies, enhancements etc.). Then a
graphql query interface is exposed allowing you to explore your applications in an incredibly
intuitive manner!

Checking out our [test fixtures](./packages/recon-engine/src/engine/__fixtures__/) is a
great place to an example of this.

Once this data is consolidated the possibility of tools to be built on top are *endless*!

Getting Started
---------------

The first thing you're going to want to do is create a new config file `.reconrc` in the working directory
of your project.

Eg.

```json
{
	"files": "src/**/!(*-test|*-tests|*.manifest).js*",
  "resolve": {
    "roots": [
      "src/core",
      "src"
    ]
  }
}
```

Configuration is pretty basic at the moment but options are documented
[here](./packages/recon-config/README.md).

#### Show me the power!

For the majority of people just looking to see what data they can pull out of their application
our interactive cli will be *the* place to look.

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

> Hint: Why not start off by trying `stats`. Then if you're feeling *extra* adventurous give `server` a go.

### I want to integrate Recon into my tool

Documentation is going to be a little skimpy here for a while since we are planning on getting
the internals of `recon-engine` to be as powerful as possible and stabilising the api as much as
possible.

Most likely you'll want to look at using `recon-engine` and `recon-server` (their tests are a decent
place to start looking).

Contributing
------------

- Bugs? Please submit a *Pull Request* with your minimal source code and a test which breaks.
- Want to fix something or add a new feature? Get started with our [Dev Guide](./docs/dev-guide.md)!

For more details on all contributions see [CONTRIBUTING.md](./CONTRIBUTING.md)

License
-------

Apache 2.0
