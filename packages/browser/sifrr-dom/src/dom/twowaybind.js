const { BIND_ATTR } = require('./constants');
const shouldMerge = require('../utils/shouldmerge');

module.exports = e => {
  const target = e.composedPath ? e.composedPath()[0] : e.target;

  if (!target.hasAttribute(BIND_ATTR) || target._root === null) return;
  if (e.type === 'update' && !target._sifrrEventSet) return;

  const value = target.value || target._state || target.textContent;
  if (target.firstChild) target.firstChild.__data = value;

  let root = target._root || target.root || target.parentNode;
  while (root && !root.isSifrr) root = root.parentNode || root.host;
  if (root) {
    target._root = root;
    const prop = target.getAttribute(BIND_ATTR);
    if (shouldMerge(value, root._state[prop])) {
      if (e.type === 'update') target._root.state = { [prop]: Object.assign({}, value) };
      else root.state = { [prop]: value };
    }
  } else target._root = null;
};
