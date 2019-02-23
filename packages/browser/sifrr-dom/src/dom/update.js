const { makeChildrenEqual } = require('./makeequal');
const { makeChildrenEqualKeyed } = require('./keyed');
const updateAttribute = require('./updateattribute');
const { evaluateBindings } = require('./bindings');
const { TEMPLATE, KEY_ATTR } = require('./constants');

function customElementUpdate(element, stateMap) {
  if (!element._refs) {
    return false;
  }
  stateMap = stateMap || element.constructor.stateMap;
  // Update nodes
  const l = element._refs.length;
  for (let i = 0; i < l; i++) {
    const data = stateMap[i].ref;
    const dom = element._refs[i];

    // update attributes
    if (data.attributes) {
      for(let key in data.attributes) {
        if (key !== 'events') {
          const val = evaluateBindings(data.attributes[key], element);
          updateAttribute(dom, key, val);
        } else {
          for(let event in data.attributes.events) {
            const eventLis = evaluateBindings(data.attributes.events[event], element);
            dom[event] = eventLis;
          }
          dom._root = element;
        }
      }
    }

    if (data.text === undefined) continue;

    // update element
    const newValue = evaluateBindings(data.text, element);

    if (data.type === 0) {
      // text node
      if (dom.data != newValue) dom.data = newValue;
    } else if (data.type === 2) {
      // repeat
      const key = dom.getAttribute(KEY_ATTR);
      if (key) makeChildrenEqualKeyed(dom, newValue, (state) => data.se.sifrrClone(true, state), key);
      else makeChildrenEqual(dom, newValue, (state) => data.se.sifrrClone(true, state));
    } else {
      // html node
      let children;
      if (Array.isArray(newValue)) {
        children = newValue;
      } else if (newValue.content && newValue.content.nodeType === 11) {
        children = Array.prototype.slice.call(newValue.content.childNodes);
      } else if (newValue.nodeType) {
        children = [newValue];
      } else if (typeof newValue === 'string') {
        const temp = TEMPLATE();
        temp.innerHTML = newValue.toString();
        children = Array.prototype.slice.call(temp.content.childNodes);
      } else {
        children = Array.prototype.slice.call(newValue);
      }
      makeChildrenEqual(dom, children);
    }
  }
  if (element.onUpdate) element.onUpdate();
}

module.exports = customElementUpdate;
