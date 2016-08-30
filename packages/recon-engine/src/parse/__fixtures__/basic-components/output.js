module.exports = {
  path: 'basic-components',
  data: {
    components: [
      {
        name: 'FunctionalComponent',
        deps: [
          {name: 'div'},
        ],
      },
      {
        name: 'ArrowFunctionalComponent',
        deps: [
          {name: 'div'},
        ],
      },
      {
        name: 'ClassComponent',
        deps: [
          {name: 'div'},
          {
            name: 'a',
            props: [
              {
                name: 'href',
                type: {type: 'StringLiteral'},
              },
            ],
          },
        ],
      },
    ],
    symbols: [
      {name: 'React'},
      {name: 'FunctionalComponent'},
      {name: 'export::FunctionalComponent'},
      {name: 'ArrowFunctionalComponent'},
      {name: 'export::ArrowFunctionalComponent'},
      {name: 'ClassComponent'},
      {name: 'export::default'},
    ],
  },
};
