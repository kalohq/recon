<p>&nbsp;</p>
<p align="center">
<img src="http://i.imgur.com/BRdEVYW.png" width="300px" />
</p>
<p>&nbsp;</p>

Recon
=====

Code Intelligence for React Applications.

[![Build Status](https://travis-ci.org/recon-js/recon.svg?branch=master)](https://travis-ci.org/recon-js/recon)

### What?

1. An [**intelligence engine**](https://www.dropbox.com/s/gybwj3oa053mh2l/Redocs%20Introduction.svg?dl=0) for understanding your component ecosystem
2. A **playground framework** for creating next-gen developer tools

### Er, what?

Here's an example!

##### Query

```graphql
{
  components {
    name
    path
    dependents {
      total
      edges {
        name
        path
      }
    }
    usages {
      total
    }
    props {
      name
      type
      usages {
        total
        edges {
          value
          path
        }
      }
    }
  }
}
```

##### Result

```js
{
  components: [
    {
      name: 'ComponentA',
      path: '/components/component-a.js::ComponentA',
      dependents: {
        total: 2,
        edges: [
          {name: 'ComponentB', '/components/component-b.js::ComponentB'},
          {name: 'ComponentC', '/components/component-c.js::ComponentC'},
        ]
      },
      usages: {
        total: 12
      },
      props: [
        {
          name: 'readOnly',
          type: {type: 'boolean', nullable: false},
          usages: {
            total: 3,
            edges: [
              {value: 'true', path: '/components/component-b.js::ComponentB'},
              {value: 'false', path: '/components/component-b.js::ComponentB'},
              {value: 'false', path: '/components/component-c.js::ComponentC'},
            ]
          }
        }
      ]
    }
  ]
}
```

### When?

Soon.

### Early Access?

[Get in touch](http://twitter.com/chrisui) and we'll hook you up!

### License

Apache 2.0
