const updateAttribute = require('./updateattribute');
const { shallowEqual } = require('../utils/json');
const { TEXT_NODE, COMMENT_NODE } = require('./constants');

// Inspired from https://github.com/Freak613/stage0/blob/master/reuseNodes.js
function makeChildrenEqual(parent, newChildren) {
  // Lesser children now
  const oldL = parent.childNodes.length, newL = newChildren.length;
  if (oldL > newL) {
    let i = oldL;
    while(i > newL) {
      parent.removeChild(parent.lastChild);
      i--;
    }
  // More Children now
  } else if (oldL < newL) {
    let i = oldL;
    while(i < newL) {
      parent.appendChild(newChildren[i]);
      i++;
    }
  }

  const l = Math.min(newL, oldL);
  // Make old children equal to new children
  for(let i = 0, item, head = parent.firstChild; i < l; i++) {
    item = newChildren[i];
    // make two nodes equal
    head = makeEqual(head, item).nextSibling;
  }
}

function makeEqual(oldNode, newNode) {
  if (newNode === null) return oldNode;
  if (newNode.type === 'stateChange') {
    if (!shallowEqual(oldNode.state, newNode.state)) {
      oldNode.state = newNode.state;
    }
    return oldNode;
  }

  if (oldNode.nodeName !== newNode.nodeName) {
    oldNode.replaceWith(newNode);
    return newNode;
  }

  if (oldNode.nodeType === TEXT_NODE || oldNode.nodeType === COMMENT_NODE) {
    if (oldNode.data !== newNode.data) oldNode.data = newNode.data;
    return oldNode;
  }

  // copy sifrr state
  if (newNode.state) oldNode.state = newNode.state;

  // copy Attributes
  let oldAttrs = oldNode.attributes, newAttrs = newNode.attributes, attr;
  for (let i = newAttrs.length - 1; i >= 0; --i) {
    updateAttribute(oldNode, newAttrs[i].name, newAttrs[i].value);
  }

  // Remove any extra attributes
  for (let j = oldAttrs.length - 1; j >= 0; --j) {
    attr = oldAttrs[j];
    if (!newNode.hasAttribute(attr.name) && attr.specified !== false) oldNode.removeAttribute(attr.name);
  }

  // make children equal
  makeChildrenEqual(oldNode, newNode.childNodes);

  return oldNode;
}

module.exports = {
  makeEqual,
  makeChildrenEqual
};
