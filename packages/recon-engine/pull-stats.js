/* eslint-disable no-console */
const data = require('./test-run.json').data;
const {
  mean: _mean,
  round,
  flatten,
  sum,
  toPairs,
  groupBy,
  flattenDeep,
  identity,
} = require('lodash');

/* calculate standard deviation */
function standardDeviation(values) { // eslint-disable-line no-unused-vars
  const avg = mean(values) || 0;
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquareDiff = mean(squareDiffs) || 0;
  return Math.sqrt(avgSquareDiff);
}

/* calculate the mean average */
function mean(values) {
  if (values.length) {
    return _mean(values);
  }

  return -1;
}


// basic sum of modules§
console.log('Num modules parsed:');
console.log(data.modules.length);


// basic sum of components
console.log('\nNum components:');
console.log(data.components.length);


// which components have the most usages?
console.log('\nMost depended on components:');
console.log(data.components.map(
  c => ({
    name: c.name,
    usages: c.dependants.map(
      d => d.usages.length
    ).reduce(
      (a, b) => a + b
    , 0)
  })
).sort(
  (a, b) => a.usages > b.usages ? -1 : 1
));


// which components create the most elements?
console.log('\nFattest components:');
console.log(data.components.map(
  c => ({
    name: c.name,
    elements: sum(c.dependencies.map(
      d => d.usages.length
    ))
  })
).sort(
  (a, b) => a.elements > b.elements ? -1 : 1
));


// which components have the most number of unique dependencies?
console.log('\nMost internally complex components:');
console.log(data.components.map(
  c => ({
    name: c.name,
    uniqueDeps: c.dependencies.length
  })
).sort(
  (a, b) => a.uniqueDeps > b.uniqueDeps ? -1 : 1
));


// which components require the most props on average to utilise?
console.log('\nMost externally complex components:');
console.log(data.components.map(
  c => ({
    name: c.name,
    avgProps: round(mean(flatten(c.dependants.map(
      d => d.usages.map(u => u.props.length)
    ))), 2),
    usages: sum(c.dependants.map(
      d => d.usages.length
    ))
  })
).sort(
  (a, b) => a.avgProps > b.avgProps ? -1 : 1
));


// which prop names do we use most?
console.log('\nFavourite prop names (from usage):');
console.log(toPairs(groupBy(flattenDeep(data.components.map(
  c => c.dependencies.map(
    d => d.usages.map(
      u => u.props.map(
        p => p.name
      )
    )
  )
)), identity)).map(([name, u]) => ({name, usages: u.length})).sort(
  (a, b) => a.usages > b.usages? -1 : 1
));


// Which components are only ever used ONCE?
console.log('\nOne trick pony components:');
console.log(data.components.filter(
  c => c.dependants.length === 1 && c.name
).map(
  c => ({name: c.name, id: c.id})
));


// which components are never used?
console.log('\nDead components? (may also be unresolved usages)');
console.log(data.components.filter(
  c => !c.dependants.length && c.name
).map(
  c => ({name: c.name, id: c.id})
));
