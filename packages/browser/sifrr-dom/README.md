# sifrr-dom · [![npm version](https://img.shields.io/npm/v/@sifrr/dom.svg)](https://www.npmjs.com/package/@sifrr/dom)

A ~6KB DOM framework for creating web user interfaces using Custom Elements with state management, one way/two way data bindings etc.

## Size

| Type                                         |                                                                                                                      Size                                                                                                                      |
| :------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| Normal (`dist/sifrr.dom.js`)                 |                    [![Normal](https://img.badgesize.io/sifrr/sifrr/master/packages/browser/sifrr-dom/dist/sifrr.dom.js?maxAge=600)](https://github.com/sifrr/sifrr/blob/master/packages/browser/sifrr-dom/dist/sifrr.dom.js)                   |
| Minified (`dist/sifrr.dom.min.js`)           |               [![Minified](https://img.badgesize.io/sifrr/sifrr/master/packages/browser/sifrr-dom/dist/sifrr.dom.min.js?maxAge=600)](https://github.com/sifrr/sifrr/blob/master/packages/browser/sifrr-dom/dist/sifrr.dom.min.js)              |
| Minified + Gzipped (`dist/sifrr.dom.min.js`) | [![Minified + Gzipped](https://img.badgesize.io/sifrr/sifrr/master/packages/browser/sifrr-dom/dist/sifrr.dom.min.js?compression=gzip&maxAge=600)](https://github.com/sifrr/sifrr/blob/master/packages/browser/sifrr-dom/dist/sifrr.dom.min.js) |

## Tradeoffs

-   :+1: Use latest web API standards ( :-1: hence will not work in older browsers without [polyfills](#browser-api-support-needed-for))
-   :+1: Pure DOM bindings (one-way, two-way), without any virtual DOM, still [fast(er)](#performance-comparison)
-   :-1: No virtual Dom (if that matters to you)
-   :-1: Slower on http/1.x due to one file per component architecture -> :+1: hence good for serving with http/2
-   :+1: Works without transpiling any code (no special syntax like jsx), and can be hosted with only a static server
-   :+1: has Keyed implementation
-   :+1: In-built Synthetic event listeners and custom events

## Performance Comparison

Ran locally on Macbook pro(MacOS 10.14/16GB/i7 3.1GHz) with [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark). Latest benchmark implementation [here](./test/public/speedtest.html)

**Note**: These might not be completely accurate and real life app speeds might differ. Just for reference.

<img src="./performance.png" alt="Performance" height='400'>

## How to use

Sifrr recommends to build webapps without any transpiling

### Directly in Browser using standalone distribution

Add script tag in your website.

```html
<script src="https://unpkg.com/@sifrr/dom@{version}/dist/sifrr.dom.min.js"></script>
```

#### Browser API support needed for

| APIs                                                   | caniuse                                       | polyfills                                          |
| :----------------------------------------------------- | :-------------------------------------------- | :------------------------------------------------- |
| Custom Elements v1                                     | <https://caniuse.com/#feat=custom-elementsv1> | <https://github.com/webcomponents/custom-elements> |
| Promises API                                           | <https://caniuse.com/#feat=promises>          | <https://github.com/stefanpenner/es6-promise>      |
| Shadow DOM v1                                          | <https://caniuse.com/#feat=shadowdomv1>       | <https://github.com/webcomponents/shadydom>        |
| Shadow DOM CSS v1 (if you are using ShadyDOM polyfill) | <https://caniuse.com/#feat=shadowdomv1>       | <https://github.com/webcomponents/shadycss>        |
| ES6 Modules (if you use type='module' on script tag)   | <https://caniuse.com/#feat=es6-module>        | <https://github.com/ModuleLoader/es-module-loader> |
| Fetch API (if you use `Sifrr.Dom.load`)                | <https://caniuse.com/#feat=fetch>             | <https://github.com/github/fetch>                  |

If custom elements v1 API is supported by browsers, it is very likely that other APIs are supported as well.

### Using npm

Do `npm i @sifrr/dom` or `yarn add @sifrr/dom` or add the package to your `package.json` file.

example, put in your frontend js module (compatible with webpack/rollup/etc):

**Note**: Do not set `sifrr-dom` to any other global variable than `window.Sifrr.Dom`.

#### Commonjs

```js
// index.js

window.Sifrr = window.Sifrr || {};
window.Sifrr.Dom = require('@sifrr/dom');
```

#### ES modules

```js
// index.js

import DOM from '@sifrr/dom';
window.Sifrr = window.Sifrr || {};
window.Sifrr.Dom = DOM;
```

## Basic API usage

### Setting Up

```js
// index.js

// Default Setup Config for Sifrr Dom
const config = {
  baseUrl: '', // base url for sifrr elements, should start with '/' and should not end with '/'
  useShadowRoot: true // use shadow root by default or not
}
// Set up Sifrr-Dom
Sifrr.Dom.setup(config);
```

### Sifrr element

**Note**: `Sifrr.Dom.load` requires [Sifrr.Fetch](../sifrr-fetch).

#### HTML Element

```html
<!-- ${baseUrl}/elements/custom/tag.html  -->

<template>
  <style media="screen">
    p {
      color: blue; // Only applies to p's inside this element if useShadowRoot is true in setup config
    }
  </style>
  <!-- Contents for element, this in binding ${} refers to the custom element itself -->
  <!-- Bindings are updated automatically on state change -->
  <p attr=${this.state.attr}>${this.state.id}</p>
  <p>${this.data()}</p>
  <!-- If you are using any custom methods in bindings, it is better they are based on state so that they are updated on state change -->
</template>
<script type="text/javascript">
  // elements name will be changing class name from camelcase to dash separated
  // eg. CutomTag -> custom-tag, LongCrazyNameElement -> long-crazy-name-element
  class CustomTag extends Sifrr.Dom.Element {
    // other methods for the custom element
    data() {
      return this.state.id * 2;
    }
  }
  CustomTag.defaultState = {
    // default state for this element
    id: 1,
    attr: 'abcd'
  }
  Sifrr.Dom.register(CustomTag);
</script>
```

#### JS Element (recommended for ES6 import capabilities)

```js
// ${baseUrl}/elements/custom/tag.js
class CustomTag extends Sifrr.Dom.Element {
  static get template() {
    // Note if you use ${} in js template literals, you should escape it. Because ${}'s value will be resolved before being passing to Sifrr.
    return Sifrr.Dom.template`<style media="screen">
      p {
        color: blue;
      }
    </style>
    <p attr=\${this.state.attr}>\${this.state.id}</p>
    <p>\${this.data()}</p>`;
  }
  // other methods for the custom element
  data() {
    return this.state.id * 2;
  }
}
CustomTag.defaultState = {
  // default state for this element
  id: 1,
  attr: 'abcd'
}
Sifrr.Dom.register(CustomTag);
```

#### Loading element

1.  Sifrr.Dom.load() - html elements or js elements

```js
// index.js

const config = {
  baseUrl: ''
}
// Requires Sifrr.Fetch
Sifrr.Dom.load('custom-tag', config = { url, js: true });
// If url is given in config, custom-tag element is loaded from that url, else
// custom-tag element is loaded from ${baseUrl}/elements/custom/tag.html
// or ${baseUrl}/elements/custom/tag.js if html gives 404
//
// set js to false if element file is html instead of js
```

2.  As module - js elements only

```js
// index.html
<script type="module">
  import '${baseUrl}/elements/custom/tag';
</script>

<script src="${baseUrl}/elements/custom/tag.js" type="module">
```

3.  Normal script tag - js elements only (recommended for best browser support)

```js
// index.html
<script src="${baseUrl}/elements/custom/tag"></script>
```

4.  HTML imports - html elements only (not recommended - deprecated by browsers)

```html
<link rel="import" href="${baseUrl}/elements/custom/tag.html">
```

#### Rendering

This html

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title></title>
  </head>
  <body>
    <!-- Put custom tag anywhere to render that element -->
    <custom-tag></custom-tag>
    <script src="index.js" charset="utf-8"></script>
  </body>
</html>
```

will render to

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title></title>
  </head>
  <body>
    <custom-tag>
      #shadow-root
      <!-- Content will be rendered in shadow root if useShadowRoot is set to true in setup config -->
        <style media="screen">
          p {
            color: blue; // Only applies to p inside this element
          }
        </style>
        <p>1</p>
        <p attr="abcd">2</p>
    </custom-tag>
    <script src="index.js" charset="utf-8"></script>
  </body>
</html>
```

#### Changing state of element

```js
const customtag = window.querySelector('custom-tag');
customtag.state = { id: 2, attr: 'xyz' }
// Note: doing `customtag.state.id = 2` doesn't work
```

This will change custom-tag to

```html
<custom-tag>
  #shadow-root
    <p attr="xyz">2</p>
    <p>4</p>
</custom-tag>
```

Changing state automatically triggers `element.update()` which updates the bindings.

#### Force update element bindings

```js
customtag.update();
```

### Components Without shadow root

#### If you don't want to use shadow root for all elements

Don't use shadow-root if you want to serve server rendered files with sifrr-seo.

```js
// index.js

const config = {
  baseUrl: '/',
  useShadowRoot: false
}
Sifrr.Dom.setup(config);
```

#### If you don't want to use shadow root for a particular component

```html
<!-- ${baseUrl}/elements/custom/tag.html -->
<template>
  <style media="screen">
    // Style here will be global
  </style>
  <!-- content -->
</template>
<script type="text/javascript">
  class CustomTag {
    static get useShadowRoot {
      return false; // Set to true if you want to use shadow-root event if default config is false
    }
  }
</script>
```

### Sifrr Element (Sifrr.Dom.Element) Methods

#### Callbacks

```js
class CustomTag extends Sifrr.Dom.Element {
  static observedAttrs() {
    return ['custom-attr']; // these attributes will be observed for changes
  }

  onConnect() {
    // called when element is connected to dom
    // A good place to manipulate dom inside the custom element like adding event listeners, etc.
  }

  onDisconnect() {
    // called when element is disconnected to dom
  }

  onAttributeChange(attrName, oldVal, newVal) {
    // called when an attribute in observedAttrs array is changed
  }

  onStateChange(newState) {
    // called when element's state is changed
  }

  onUpdate() {
    // called when element is updated
  }
}
```

#### Clearing state of element

```js
customtag.clearState() // Not recommended to avoid blank bindings
```

#### Query selectors for custom element content

```js
// querySelector
customtag.$(selector, /* shadowRoot = default: true if element uses shadow root else false */);
// querySelectorAll
customtag.$$(selector, /* shadowRoot = default: true if element uses shadow root else false */);
// If shadowRoot is true, it selects elements inside element shadowRoot else it will select elements inside it
```

Sifrr adds $ and $$ to all HTMLElements, and works same as querySelector and querySelectorAll.

### Synthetic events

```js
// example for adding 'click' event listeners, can be replaced with any type of event (even custom events)

// Add synthetic event listerner (only need to be called once for one type of event)
Sifrr.Dom.Event.add('click');

// Adding event callback on an element (any html element), works inside shadowRoots also
el._click = fxn;
// fxn will be called with two arguments `fxn(event, target)` and `this` inside function will be it's parent custom element if available, else window.

// Add _click attribute to html directly
// <a _click="console.log(this, event, target)"></a>

// Adding a generic event callback
Sifrr.Dom.Event.addListener('click', selector, fxn);
// fxn will be called with same two arguments as before if event target matches the selector provided

// Triggering custom events
Sifrr.Dom.Event.trigger(target, 'custom:event', options);
// options are same as options for new window.Event(target, 'custom:event', options);
```

**Note**: Synthetic event listeners are always passive, hence, `event.preventDefault()` can not be called inside the function.

### More complex apis

#### html in bindings

```html
<!-- ${baseUrl}/elements/custom/tag.html -->

<template>
  <div data-sifrr-html="true">
    <!-- comment bindings are allowed inside data-sifrr-html="true" -->
    <!-- Multiple bindings are allowed if they are html string -->
    ${this.html()}
    ${this.state.html}
    <!-- ${this.state.html2} -->
  <div>
  <div data-sifrr-html="true">
    <!-- Only one binding is allowed if it is html component or array of components -->
    ${this.state.htmlElement}
  <div>
</template>
<script type="text/javascript">
  class CustomTag extends Sifrr.Dom.Element {
    html() {
      return '<p>html function</p>';
    }
  }
  CustomTag.defaultState = {
    html: '<div><p>normal html<p><div>',
    html2: '<div>comment html<div>',
    htmlElement: document.createElement('table')
  }
  Sifrr.Dom.register(CustomTag);
</script>
```

this will render

```html
<custom-tag>
  #shadow-root
    <div data-sifrr-html="true">
      <p>html function</p>
      <div>
        <p>normal html<p>
      <div>
      <div>
        comment html
      <div>
    <div>
    <div data-sifrr-html="true">
      <table></table>
    <div>
</custom-tag>
```

#### input/select/textarea/contenteditable one way, two way bindings

```html
<!-- inside template -->
<!-- One Way bindings to value, updates value/content when state is changed -->
<input value=${this.state.input}>
<select value="${this.state.select}">
  <!-- options -->
</select>
<textarea>${this.state.textarea}</textarea>
<div contenteditable>
  ${this.state.elements}
</div>

<!-- One Way bindings from value, updates state when value/content is changed (on input/change event) -->
<input data-sifrr-bind="input">
<select data-sifrr-bind="select">
  <!-- options -->
</select>
<textarea data-sifrr-bind="textarea"></textarea>
<div contenteditable data-sifrr-bind="elements">
</div>

<!-- Both together -->
<input value=${this.state.input} data-sifrr-bind="input">
<select value="${this.state.select}"  data-sifrr-bind="select">
  <!-- options -->
</select>
<textarea data-sifrr-bind="textarea">${this.state.textarea}</textarea>
<div contenteditable data-sifrr-bind="elements">
  ${this.state.elements}
</div>
```

#### Repeating a dom for Array

parses array to dom nodes in bindings

##### Repeating other sifrr element

```html
<!-- ${baseUrl}/elements/custom/array.html -->

<template>
  <p>${this.state.id}</p>
</template>
<script type="text/javascript">
  class CustomArray extends Sifrr.Dom.Element {}
  Sifrr.Dom.register(CustomArray);
</script>
```

```html
<!-- ${baseUrl}/elements/custom/tag.html -->

<template>
<!-- data-sifrr-repeat should be binded to an array data which you want to repeat for inside element
   data-sifrr-key is key of individual data which will be used in keyed updates/reconciliation -->
  <div data-sifrr-repeat="${this.state.data}" data-sifrr-key="id">
    <custom-array></custom-array> // data-sifrr-repeat should contain only one element node
  <div>
</template>
<script type="text/javascript">
  class CustomTag extends Sifrr.Dom.Element {

  }
  CustomTag.defaultState = {
    data: [{ id: '1' }, { id: '2' }] // Each state will be passed to elements created by arrayToDom
  }
  Sifrr.Dom.load('custom-array').then(() => { // Wait for `custom-array` to be loaded so that there is no race condition
    Sifrr.Dom.register(CustomTag);
  });
</script>
```

then, `<custom-tag></custom-tag>` will render:

```html
<custom-tag>
  #shadow-root
  <div data-sifrr-key="id">
    <custom-array>
      #shadow-root
        <p>1</p>
    </custom-array>
    <custom-array>
      #shadow-root
        <p>2</p>
    </custom-array>
  <div>
<custom-tag>
```

##### Repeating normal element

```html
<!-- ${baseUrl}/elements/custom/tag.html -->

<template>
<!-- data-sifrr-repeat should be binded to an array data which you want to repeat for inside element
   data-sifrr-key is key of individual data which will be used in keyed updates/reconciliation -->
  <div data-sifrr-repeat="${this.state.data}" data-sifrr-key="${this.state.key}">
    <div> // data-sifrr-repeat should contain only one element node
      <p>${id}</p>
    </div>
  <div>
</template>
<script type="text/javascript">
  class CustomTag extends Sifrr.Dom.Element {}
  CustomTag.defaultState = {
    data: [{ id: '1' }, { id: '2' }], // Each state will be passed to elements created by arrayToDom
    key: 'id'
  }
  Sifrr.Dom.register(CustomTag);
</script>
```

then, `<custom-tag></custom-tag>` will render:

```html
<custom-tag>
  #shadow-root
  <div data-sifrr-key="id">
    <div>
      <p>1</p>
    </div>
    <div>
      <p>2</p>
    </div>
  <div>
<custom-tag>
```

#### Extending another declared html element

Sifrr element can extend other html elements also, eg:
CustomTag extends HTMLButtonElement here, note that register call has { extends: 'button' } as second argument

```js
class CustomTag extends Sifrr.Dom.Element.extends(HTMLButtonElement) {}
Sifrr.Dom.register(SifrrSmaller, {
  extends: 'button'
});
```

then you can use custom-tag as button in html like:

```html
<button is="custom-tag"></button>
```

#### slots

-   Slots work same as it would in web components, but note that bindings in slot elements won't work

## More readings

-   <https://developers.google.com/web/fundamentals/web-components/customelements>

## Special thanks to

-   <https://github.com/Freak613/stage0> for optimization ideas and reconciliation algorithm
-   <https://github.com/krausest/js-framework-benchmark> for benchmarking performance, sifrr implementation was added [here](https://github.com/krausest/js-framework-benchmark/pull/503)
