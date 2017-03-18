/* eslint-disable no-console */
const {
  mean: _mean,
  round,
  flatten,
  sum,
  toPairs,
  groupBy,
  flattenDeep,
  identity,
  flatMap,
} = require('lodash');

/* calculate the mean average */
function mean(values) {
  if (values.length) {
    return _mean(values);
  }

  return 0;
}

/** Create stats given a blob of data (queried from recon engine) */
function makeStats({data}) {
  return [
    {
      title: 'Num modules parsed',
      description: 'How many modules did we explore?',
      data: data.modules.length,
    },

    {
      title: 'Num components',
      description: 'How many component definitions did we find?',
      data: data.components.length,
    },

    {
      title: 'Most depended on components',
      description: 'Which components have the most usages?',
      headers: ['Component Name', 'Num Usages'],
      data: data.components
        .map(c => ({
          name: c.name,
          usages: c.dependants
            .map(d => d.usages.length)
            .reduce((a, b) => a + b, 0),
        }))
        .sort((a, b) => a.usages > b.usages ? -1 : 1)
        .map(c => [c.name, c.usages]),
    },

    {
      title: 'Fattest components',
      description: 'Which components render the most elements?',
      headers: ['Component Name', 'Rendered elements'],
      data: data.components
        .map(c => ({
          name: c.name,
          elements: sum(c.dependencies.map(d => d.usages.length)),
        }))
        .sort((a, b) => a.elements > b.elements ? -1 : 1)
        .map(c => [c.name, c.elements]),
    },

    {
      title: 'Most externally complex components',
      description: 'Which components require the most interface?',
      headers: ['Component Name', 'Average Props', 'Component Usages'],
      data: data.components
        .map(c => ({
          name: c.name,
          avgProps: round(
            mean(
              flatten(c.dependants.map(d => d.usages.map(u => u.props.length)))
            ),
            2
          ),
          usages: sum(c.dependants.map(d => d.usages.length)),
        }))
        .sort((a, b) => a.avgProps > b.avgProps ? -1 : 1)
        .map(c => [c.name, c.avgProps, c.usages]),
    },

    {
      title: 'Most internally complex components',
      description: 'Which components deal with the most amount of unique dependencies?',
      headers: ['Component Name', 'Unique Dependencies'],
      data: data.components
        .map(c => ({
          name: c.name,
          uniqueDeps: c.dependencies.length,
        }))
        .sort((a, b) => a.uniqueDeps > b.uniqueDeps ? -1 : 1)
        .map(c => [c.name, c.uniqueDeps]),
    },

    {
      title: 'Dead components',
      description: 'Which components are never referenced?',
      headers: ['Component Name'],
      data: data.components
        .filter(c => !c.dependants.length && c.name)
        .map(c => [c.name]),
    },

    {
      title: 'One trick ponies (internal)',
      description: 'Which components are only ever used once?',
      headers: ['Component Name'],
      data: data.components
        .filter(
          c =>
            c.dependants.length === 1 &&
            c.module.path === c.dependants[0].component.module.path
        )
        .map(c => [c.name]),
    },

    {
      title: 'One trick ponies (external)',
      description: 'Which components are only ever used once and imported from an external module?',
      headers: ['Component Name'],
      data: data.components
        .filter(
          c =>
            c.dependants.length === 1 &&
            c.module.path !== c.dependants[0].component.module.path
        )
        .map(c => [c.name]),
    },

    {
      title: 'Favourite prop names',
      description: 'Which prop names are most popular in usage?',
      headers: ['Prop name', 'Usages'],
      data: toPairs(
        groupBy(
          flattenDeep(
            data.components.map(c =>
              c.dependencies.map(d =>
                d.usages.map(u => u.props.map(p => p.name))))
          ),
          identity
        )
      )
        .map(([name, u]) => ({name, usages: u.length}))
        .sort((a, b) => a.usages > b.usages ? -1 : 1)
        .map(c => [c.name, c.usages]),
    },

    {
      debug: true, // only show in debug mode
      title: 'Unresolved dependencies',
      description: 'Usages where the component definition was not found',
      headers: ['Parent Component', 'Dependency Name'],
      data: flatMap(data.components, c =>
        c.dependencies.filter(dep => !dep.component).map(dep => ({
          depName: dep.name,
          parent: c.id,
        }))).map(c => [c.parent, c.depName]),
    },
  ];
}

module.exports = makeStats;
