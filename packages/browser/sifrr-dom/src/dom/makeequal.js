const updateAttribute = require('./updateattribute');
const { shallowEqual } = require('../utils/json');
const { TEXT_NODE, COMMENT_NODE } = require('./constants');

function makeChildrenEqual(parent, newChildren, createFn, isNode = false) {
  const oldL = parent.childNodes.length, newL = newChildren.length;
  let curNewChild = newChildren[0];
  // Fast path for clear
  if (newL === 0) {
    parent.textContent = '';
    return;
  }

  // Lesser children now
  if (oldL > newL) {
    let i = oldL;
    while(i > newL) {
      parent.removeChild(parent.lastChild);
      i--;
    }
  }

  // Make old children equal to new children
  for(let i = 0, item, head = parent.firstChild; i < newL; i++) {
    if (i < oldL) {
      // make two nodes equal
      if (isNode) {
        item = curNewChild.nextSibling;
        head = makeEqual(head, curNewChild).nextSibling;
        curNewChild = item;
      } else {
        head = makeEqual(head, newChildren[i]).nextSibling;
      }
    } else {
      // No old node
      if (isNode) {
        while(curNewChild) {
          item = curNewChild.nextSibling;
          parent.appendChild(curNewChild);
          curNewChild = item;
          i++;
        }
      } else {
        while(i < newL) {
          item = newChildren[i];
          if (!item.nodeType) item = createFn(item);
          parent.appendChild(item);
          i++;
        }
      }
    }
  }
}

function makeEqual(oldNode, newNode) {
  if (!newNode.nodeType) {
    if (!shallowEqual(oldNode.state, newNode)) {
      oldNode.state = newNode;
    }
    return oldNode;
  }

  if (oldNode.nodeName !== newNode.nodeName) {
    oldNode.replaceWith(newNode);
    return newNode;
  }

  // Text or comment node
  if (oldNode.nodeType === TEXT_NODE || oldNode.nodeType === COMMENT_NODE) {
    if (oldNode.data !== newNode.data) oldNode.data = newNode.data;
    return oldNode;
  }

  // copy sifrr state
  if (newNode.state) oldNode.state = newNode.state;

  // copy Attributes
  const oldAttrs = oldNode.attributes, newAttrs = newNode.attributes;
  for (let i = newAttrs.length - 1; i >= 0; --i) {
    updateAttribute(oldNode, newAttrs[i].name, newAttrs[i].value);
  }

  // Remove any extra attributes
  for (let j = oldAttrs.length - 1; j >= 0; --j) {
    if (!newNode.hasAttribute(oldAttrs[j].name)) oldNode.removeAttribute(oldAttrs[j].name);
  }

  // make children equal
  makeChildrenEqual(oldNode, Array.prototype.slice.call(newNode.childNodes));

  return oldNode;
}

module.exports = {
  makeEqual,
  makeChildrenEqual
};
