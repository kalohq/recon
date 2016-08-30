module.exports = {
  path: 'enhanced-components',
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
        name: 'EnhancedArrowFunctionalComponent',
        deps: [
          {name: 'div'},
        ],
        enhancements: [
          {type: 'CallExpression'},
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
      {name: 'withState'},
      {name: 'compose'},
      {name: 'createContainer'},
      {name: 'FunctionalComponent'},
      {name: 'export::FunctionalComponent'},
      {name: 'EnhancedFunctionalComponent'},
      {name: 'export::EnhancedFunctionalComponent'},
      {name: 'ArrowFunctionalComponent'},
      {name: 'export::ArrowFunctionalComponent'},
      {name: 'enhance'},
      {name: 'EnhancedArrowFunctionalComponent'},
      {name: 'export::EnhancedArrowFunctionalComponent'},
      {name: 'ClassComponent'},
      {name: 'export::default'},
    ],
  },
};
