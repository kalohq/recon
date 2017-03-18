/* eslint-disable */
import React from 'react';

export function FunctionalComponent() {
  return <div>Hello world!</div>;
}

export const ArrowFunctionalComponent = () => <div />;

export default class ClassComponent {
  render() {
    return <div>Hello world! <a href="link">Click Here!</a></div>;
  }
}
