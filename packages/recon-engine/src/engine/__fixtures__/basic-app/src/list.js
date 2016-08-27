/* eslint-disable */
import React from 'react';

export function ListItem({type, children}) {
  return (
    <li>
      {children}
    </li>
  )
}

export default function List({children, type}) {
  return (
    <ul>
      {children}
    </ul>
  )
}
