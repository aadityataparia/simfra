(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Sifrr = global.Sifrr || {}, global.Sifrr.Dom = factory());
}(this, (function () { 'use strict';

  class URLExt {
    static absolute(base, relative) {
      let stack = base.split('/'),
          parts = relative.split('/');
      stack.pop();
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] == '.') continue;
        if (parts[i] == '..') stack.pop();else stack.push(parts[i]);
      }
      return stack.join('/');
    }
    static getRoutes(url) {
      if (url[0] != '/') {
        url = '/' + url;
      }
      let qIndex = url.indexOf('?');
      if (qIndex != -1) {
        url = url.substring(0, qIndex);
      }
      return url.split('/');
    }
  }
  var url = URLExt;

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var sifrr_fetch = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
      module.exports = factory();
    })(commonjsGlobal, function () {
      class Request {
        constructor(type, url, options) {
          this.type = type;
          this._options = options;
          this._url = url;
        }
        get response() {
          return window.fetch(this.url, this.options).then(resp => {
            let contentType = resp.headers.get('content-type'),
                result;
            if (contentType && contentType.includes('application/json')) {
              result = resp.json();
            } else {
              result = resp.text();
            }
            if (resp.ok) {
              return result;
            } else {
              let error = Error(resp.statusText);
              error.response = result;
              throw error;
            }
          });
        }
        get url() {
          let params = delete this._options.params;
          if (params && Object.keys(params).length > 0) {
            return this._url + '?' + Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
          } else {
            return this._url;
          }
        }
        get options() {
          return Object.assign(this._options, {
            method: this.type,
            headers: Object.assign({
              'accept': 'application/json'
            }, this._options.headers || {}),
            mode: 'cors',
            redirect: 'follow'
          });
        }
      }
      var request = Request;
      class SifrrFetch {
        static get(url, options = {}) {
          return new request('GET', url, options).response;
        }
        static post(url, options = {}) {
          return new request('POST', url, options).response;
        }
        static put(url, options = {}) {
          return new request('PUT', url, options).response;
        }
        static delete(url, options = {}) {
          return new request('DELETE', url, options).response;
        }
        static file(url, options = {}) {
          options.headers = options.headers || {};
          options.headers.accept = options.headers.accept || '*/*';
          return new request('GET', url, options).response;
        }
      }
      var sifrr_fetch = SifrrFetch;
      return sifrr_fetch;
    });
  });

  function HTMLElementClass(link, c) {
    return class extends HTMLElement {
      static get observedAttributes() {
        return ['sifrr-state'].concat(c.observedAttributes || []);
      }
      constructor() {
        super();
        const template = link.import.querySelector('template');
        if (template.getAttribute("relative-url") == "true") {
          let baseUrl = link.href;
          let insideHtml = template.innerHTML;
          let href_regex = /href=['"]?((?!http)[a-zA-z.\/\-\_]+)['"]?/g;
          let src_regex = /src=['"]?((?!http)[a-zA-z.\/\-\_]+)['"]?/g;
          let newHtml = insideHtml.replace(href_regex, replacer);
          newHtml = newHtml.replace(src_regex, replacer);
          function replacer(match, g1) {
            return match.replace(g1, url.absolute(baseUrl, g1));
          }
          template.innerHTML = newHtml;
        }
        if (template.getAttribute('shadow-root') === "false") {
          c.sr = false;
        } else {
          const shadowRoot = this.attachShadow({
            mode: 'open'
          }).appendChild(template.content.cloneNode(true));
          c.sr = true;
        }
        if (template.getAttribute('state') === "false") Object.defineProperty(this, 'state', {
          set: function (v) {
            console.log('State is not enabled for ', this);
          },
          get: function () {
            console.log('State is not enabled for ', this);
          }
        });
        c.vdom = SFComponent.toVDOM(template.content.cloneNode(true));
        if (typeof c.createdCallback === "function") {
          c.createdCallback(this);
        }
      }
      attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName === "data-bind") {
          this.state = {
            bind: tryParseJSON(newVal)
          };
        }
        if (typeof c.attributeChangedCallback === "function") {
          c.attributeChangedCallback(this, attrName, oldVal, newVal);
        }
      }
      connectedCallback() {
        let defaultState = c.defaultState || {};
        let dataBind = tryParseJSON(this.dataset.bind) || {};
        let oldState = this.state;
        this.state = Object.assign(defaultState, {
          bind: dataBind
        }, oldState);
        if (this.shadowRoot) this.shadowRoot.addEventListener('change', SFComponent.twoWayBind);else this.addEventListener('change', SFComponent.twoWayBind);
        if (typeof c.connectedCallback === "function") {
          c.connectedCallback(this);
        }
      }
      disconnectedCallback() {
        if (typeof c.disconnectedCallback === "function") {
          c.disconnectedCallback(this);
        }
      }
      clone(deep = true) {
        let ans = this.cloneNode(deep);
        ans.state = this.state;
        return ans;
      }
      get state() {
        return this._state;
      }
      set state(v) {
        this._state = this._state || {};
        let oldState = Object.assign({}, this._state);
        Object.assign(this._state, v);
        SFComponent.updateState(this, oldState);
      }
      get sifrr() {
        return true;
      }
      clearState() {
        this._state = {};
        SFComponent.updateState(this);
      }
    };
  }
  class Element {
    constructor(base) {
      this.name = base.name;
      this.html = base.html;
      this.base = base;
      if (this._isElementOk()) {
        this._create();
      }
    }
    _isElementOk() {
      if (!this.name) {
        console.log(`Error creating Element: No name given.`);
      } else if (window.customElements.get(this.name)) {
        console.log(`Error creating Element: ${this.name} - Element with this name is already defined.`);
      } else if (this.name.indexOf("-") < 1) {
        console.log(`Error creating Element: ${this.name} - Element name must have one dash '-'`);
      } else {
        return true;
      }
      return false;
    }
    _create() {
      let link = document.createElement('link');
      const klass = HTMLElementClass(link, this.base);
      link.rel = 'import';
      link.href = this.html;
      link.setAttribute('async', '');
      link.onload = function (e) {
        try {
          window.customElements.define(this.name, klass);
        } catch (error) {
          console.log(`Error creating Element: ${this.name} - ${error}`);
        }
      };
      link.onerror = function (e) {
        console.log(e);
      };
      window.document.head.appendChild(link);
    }
  }
  var element = Element;

  class SifrrDOM {
    constructor(name, html = null) {
      this.name = name;
      let route = name.split('-').join('/');
      this.html = typeof html === 'string' ? html : '/elements/' + route + '.html';
      if (Array.isArray(name)) {
        return name.map(e => new this.constructor(e));
      } else if (typeof name == 'object') {
        return Object.keys(name).map(k => new this.constructor(k, name[k]));
      }
      this._registerElement();
      this.constructor.add(name, this);
    }
    _registerElement() {
      this.customElement = new element(this);
    }
    static add(name, instance) {
      this.elements[name] = instance;
    }
  }
  SifrrDOM.elements = {};
  var sifrr_dom = SifrrDOM;

  return sifrr_dom;

})));
