import React from 'react';
import {withState, compose} from 'recompose';
import {createContainer} from 'recall';

export function FunctionalComponent () {
  return (
    <div>Hello world!</div>
  );
}

// Note we currently do not detect this as a "directly enhanced" component
// but rather it can be imported as an enhancement path for the
// referenced FunctionalComponent
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
