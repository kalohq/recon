module.exports = {
  path: 'dynamic-components',
  data: {
    components: [
      {
        id: String,
        name: 'Flex',
        deps: [
          {name: 'div'}
        ],
        createdBy: {
          name: 'makeComponent'
        }
      }
    ],
    symbols: [
      {name: 'React'},
      {name: 'makeComponent'},
      {name: 'Flex'},
      {name: 'export::Flex'},
    ]
  }
};
