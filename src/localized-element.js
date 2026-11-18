// Translate presentation strings at React's host-element boundary.
// Input values, event handlers and component props retain their canonical values.
import React from 'react';
import { isHK, localize } from './language.js';

export const original = value => React.createElement(React.Fragment, null, value);
export const recipeText = (recipe, text) => recipe?.community ? original(text) : text;
const translateChild = child => Array.isArray(child) ? child.map(translateChild) : localize(child);
export function localizedElement(type, props, ...children) {
  if (typeof type === 'string' && isHK()) {
    if (props) {
      props = {...props};
      for (const key of ['aria-label', 'title', 'alt', 'placeholder']) {
        if (typeof props[key] === 'string') props[key] = localize(props[key]);
      }
    }
    if (type === 'option' && props?.value == null && typeof children[0] === 'string')
      props = {...props, value: children[0]};
    if (type !== 'textarea') children = children.map(translateChild);
  }
  return React.createElement(type, props, ...children);
}
