import { Element, load, Event, register } from '@sifrr/dom';
import RegexPath from './regexpath';

const firstTitle = window.document.title;
class SifrrRoute extends Element {
  static get template() {
    return '<slot></slot>';
  }

  static syncedAttrs() {
    return ['path'];
  }

  onConnect() {
    this.loaded = false;
    this.refresh();
    this.constructor.all.add(this);
  }

  onDisconnect() {
    this.constructor.all.delete(this);
  }

  onAttributeChange(attrName) {
    if (attrName === 'path') {
      this.routeRegex = new RegexPath(this.path);
      this.refresh();
    }
  }

  refresh() {
    const loc = window.location.pathname;
    const parsed = this.routeRegex.test(loc);
    if (parsed.match) {
      this.setState(parsed.data);
      this.activate();
      this.$$('[data-sifrr-route-state=true]', false).forEach(el => {
        el.state = { route: parsed.data };
      });
    } else this.deactivate();
  }

  activate() {
    if (!this.loaded) {
      const sifrrElements = this.dataset.sifrrElements;
      if (sifrrElements && sifrrElements.indexOf('-') > 0) {
        try {
          const elements = JSON.parse(sifrrElements);
          this.loaded = Promise.all(Object.keys(elements).map(k => load(k, elements[k])));
        } catch (e) {
          this.loaded = Promise.all(sifrrElements.split(',').map(k => load(k)));
        }
      } else {
        this.loaded = Promise.resolve(true);
      }
    }
    this.renderIf = true;
    this.update();
    Event.trigger(this, 'activate');
    this.onActivate();
  }

  onActivate() {}

  deactivate() {
    this.renderIf = false;
    this.update();
    Event.trigger(this, 'deactivate');
    this.onDeactivate();
  }

  onDeactivate() {}

  static refreshAll() {
    if (window.location.pathname === this.currentUrl) return;
    this.all.forEach(sfr => sfr.refresh());
    this.currentUrl = window.location.pathname;
    this.onRouteChange();
  }

  static onRouteChange() {}

  static clickEventListener(e) {
    if (!(window.history && window.history.pushState)) return false;
    if (e.metaKey || e.ctrlKey) return false;

    // find closest link element
    const composedPath = e.composedPath ? e.composedPath() : [e.target],
      l = composedPath.length;
    let target;
    for (let i = 0; i < l; i++) {
      const t = composedPath[i];
      if (t.matches && t.matches('a')) {
        target = t;
        break;
      }
    }

    if (
      !target ||
      target.host !== window.location.host ||
      (target.target && target.target !== '_self')
    )
      return false;

    e.preventDefault();
    // replace title with First title if there's no attribute
    const title = target.getAttribute('title') || firstTitle;
    const state = {
      pathname: target.pathname,
      href: target.href,
      title: title
    };
    window.document.title = title;
    window.history.pushState(state, title, target.href);
    SifrrRoute.refreshAll();

    return true;
  }

  static popstateEventListener(e) {
    if (e.state && e.state.title) document.title = e.state.title;
    // replace title with First title if there's no state title
    else window.document.title = firstTitle;
    SifrrRoute.refreshAll();
  }
}

SifrrRoute.all = new Set();

Event.add('activate');
Event.add('deactivate');
register(SifrrRoute);

window.addEventListener('popstate', SifrrRoute.popstateEventListener);
window.document.addEventListener('click', SifrrRoute.clickEventListener);

export { RegexPath, SifrrRoute };
