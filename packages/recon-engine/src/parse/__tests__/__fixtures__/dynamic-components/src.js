/* eslint-disable */
import React from 'react';

function makeComponent(staticProps) {
  return props => <div {...staticProps} {...props} />;
}

export const Flex = makeComponent({style: {display: 'flex'}});
