import React from 'react';
import {withState, compose} from 'recompose';
import {createContainer} from 'recall';

export function FunctionalComponent () {
  return (
    <div>Hello world!</div>
  );
}

// Note we currently do not detect this as a "directly enhanced" component
// but rather it can be seen as an "enhancement path" for the
// referenced `FunctionalComponent`. Ie. if `EnhancedFunctionalComponent`
// was referenced as a dep from another component we could trace it back
// to `FunctionalComponent` but mark this as a "enhancement path".
// In the future we may want to discover all these within a module at parse time.
export const EnhancedFunctionalComponent = withState()(
  FunctionalComponent
);

export const ArrowFunctionalComponent = () => <div></div>;

const enhance = compose(
  createContainer(),
  withState()
);

export const EnhancedArrowFunctionalComponent = enhance(
  () => <div></div>
);

export default class ClassComponent {
  render() {
    return (
      <div>Hello world! <a href="link">Click Here!</a></div>
    )
  }
};
