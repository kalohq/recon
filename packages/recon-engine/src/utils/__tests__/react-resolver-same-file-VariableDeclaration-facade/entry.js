/* eslint-disable */
import React from 'react';

const _Definition = () => (
  <div>Test Component</div>
);

const Definition = withState('test', createContainer({}, _Definition));

export default Definition;
