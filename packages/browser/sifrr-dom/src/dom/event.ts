import { SifrrEventListener } from './types';

// Inspired from https://github.com/Freak6133/stage0/blob/master/syntheticEvents.js
const SYNTHETIC_EVENTS: {
  [name: string]: {
    [css: string]: Set<SifrrEventListener>;
  };
} = {};
const listenOpts = { capture: true, passive: true };
const customOpts = { composed: true, bubbles: true };

const cssMatchEvent = (e: Event, name: string, dom: HTMLElement, target: HTMLElement) => {
  function callEach(fxns: Set<SifrrEventListener>, isElement: boolean) {
    fxns.forEach(fxn => {
      if (!isElement || fxn.__dom === dom) fxn(e, target, dom);
    });
  }
  for (const css in SYNTHETIC_EVENTS[name]) {
    if (
      (typeof dom.matches === 'function' && dom.matches(css)) ||
      (dom.nodeType === 9 && css === 'document') ||
      css === 'element'
    )
      callEach(SYNTHETIC_EVENTS[name][css], css === 'element');
  }
};

export { SYNTHETIC_EVENTS as all };

export const getEventListener = (name: string): EventListener => {
  return (e: Event) => {
    const target = <HTMLElement>(e.composedPath ? e.composedPath()[0] : e.target);
    let dom = target;
    while (dom) {
      const eventHandler =
        dom[`_${name}`] || (dom.hasAttribute ? dom.getAttribute(`_${name}`) : null);
      if (typeof eventHandler === 'function') {
        eventHandler.call(dom._root || window, e, target);
      } else if (typeof eventHandler === 'string') {
        new Function('event', 'target', eventHandler).call(dom._root || window, event, target);
      }
      cssMatchEvent(e, name, dom, target);
      dom = <HTMLElement>dom.parentNode || dom.host;
    }
  };
};

export const add = (name: string) => {
  if (SYNTHETIC_EVENTS[name]) return false;
  const namedEL = getEventListener(name);
  document.addEventListener(name, namedEL, listenOpts);
  SYNTHETIC_EVENTS[name] = {};
  return true;
};

export const addListener = (name: string, css: string, fxn: SifrrEventListener) => {
  if (!SYNTHETIC_EVENTS[name])
    throw Error(`You need to call Sifrr.Dom.Event.add('${name}') before using listeners.`);
  if (typeof css !== 'string') {
    fxn.__dom = css;
    css = 'element';
  }
  SYNTHETIC_EVENTS[name][css] = SYNTHETIC_EVENTS[name][css] || new Set();
  SYNTHETIC_EVENTS[name][css].add(fxn);
  return true;
};

export const removeListener = (name: string, css: string, fxn: SifrrEventListener) => {
  if (SYNTHETIC_EVENTS[name][css]) SYNTHETIC_EVENTS[name][css].delete(fxn);
  return true;
};

export const trigger = (
  el: HTMLElement,
  name: string,
  options: { detail: any; [n: string]: any }
) => {
  if (typeof el === 'string') el = <HTMLElement>document.$(el);
  el.dispatchEvent(new CustomEvent(name, Object.assign(customOpts, options)));
};
