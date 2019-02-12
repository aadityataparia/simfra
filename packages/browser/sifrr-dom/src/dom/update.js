const { makeChildrenEqual } = require('./makeequal');
const { evaluateString } = require('./parser');
const TEMPLATE = require('./constants').TEMPLATE();
const updateAttribute = require('./updateattribute');

function update(element, stateMap = element.constructor.stateMap, isSimple = false) {
  if (!element._refs) {
    return false;
  }
  // Update nodes
  const l = element._refs.length;
  for (let i = 0; i < l; i++) {
    const data = stateMap[i].ref;
    const dom = element._refs[i];

    // update attributes
    if (data.attributes) {
      for(let key in data.attributes) {
        if (key === 'events') {
          for(let event in data.attributes.events) {
            const eventLis = evaluateString(data.attributes.events[event], element, isSimple);
            if (data.attributes.events[event].slice(0, 6) === '${this') {
              dom[event] = eventLis.bind(element);
            } else {
              dom[event] = eventLis;
            }
          }
          delete data.attributes.events;
        } else if (key === 'style') {
          for (let k in data.attributes.style) {
            dom.style[k] = evaluateString(data.attributes.style[k], element, isSimple);
          }
        } else {
          const val = evaluateString(data.attributes[key], element, isSimple);
          updateAttribute(dom, key, val);
        }
      }
    }

    if (data.html === undefined) continue;

    // update element
    const newValue = evaluateString(data.text, element, isSimple);
    if (!newValue) { dom.textContent = ''; continue; }

    if (data.html) {
      // html node
      let children;
      if (Array.isArray(newValue)) {
        children = newValue;
      } else if (newValue.nodeType) {
        children = [newValue];
      } else {
        // Replace html tags in input from input/contenteditable/textarea
        TEMPLATE.innerHTML = newValue.toString()
          // All closing tags
          .replace(/(&lt;)(((?!&gt;).)*)(&gt;)(((?!&lt;).)*)(&lt;)\/(((?!&gt;).)*)(&gt;)/g, '<$2>$5</$8>')
          // Self closing tags (void elements) from https://html.spec.whatwg.org/multipage/syntax.html#void-elements
          .replace(/(&lt;)(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(((?!&gt;).)*)(&gt;)/g, '<$2$3>');
        children = Array.prototype.slice.call(TEMPLATE.content.childNodes);
      }
      if (children.length < 1) dom.textContent = '';
      else makeChildrenEqual(dom, children);
    } else {
      // text node
      if (dom.nodeValue != newValue) {
        dom.nodeValue = newValue;
      }
    }
  }
}

module.exports = update;
