# sifrr-template · [![npm version](https://img.shields.io/npm/v/@sifrr/template.svg)](https://www.npmjs.com/package/@sifrr/template) [![Doscify](https://img.shields.io/badge/API%20docs-Docsify-red.svg)](https://sifrr.github.io/sifrr/#/./packages/browser/sifrr-template/)

A superfast HTML in JS Templating engine that powers @sifrr/dom. Inspired from `styled-components` api!

## Size

| Type               |                            Size                             |
| :----------------- | :---------------------------------------------------------: |
| Minified           |  ![](https://badgen.net/bundlephobia/min/@sifrr/template)   |
| Minified + Gzipped | ![](https://badgen.net/bundlephobia/minzip/@sifrr/template) |

## Features

- Written in TypeScript, usable in TypeScript as well as JavaScript

## How to use

### Basic Usage

```js
const { html, update } = require('@sifrr/template'); // node require
import { html, update } from '@sifrr/template'; // es module
const { html, update } = Sifrr.Template; // if distribution files are used directly

// define a template
const MainTemplate = html`
  <div>
    ${({ name }) => name}
  </div>
`;

// create a instance
const mainTemplateInstance = MainTemplate({ name: 'Aaditya' }); // returns `Node[]`
// new DOM nodes are created on create call

document.body.append(...mainTemplateInstance);
// this renders
// <div>Aaditya</div>
// inside body

// updating template
update(mainTemplateInstance, { name: 'new name' });
// this will update the rendered html to
// <div>new name</div>
// all bindings are recalculated and rendered if needed on update call
```

### Bindings

The functions (`${({ name }) => name}`) in between your html template literal you passed to `html` function are called bindings.
Functions are not used, rather the return value of these functions are used.

First argument in binding function is `props` passed in when creating/updating template instance.
Second argument is oldValue (value returned by binding in last render) of that binding.

All arguments given in binding function are immutable. Avoid updating them, else there might be unintended effects.

There are three types of bindings:

#### 1. DOM bindings

Function passed inside dom, that renders dom nodes are DOM bindings.

```ts
// typescript typings
type DomBindingReturnValue =
  | null
  | undefined
  | string
  | Node
  | Node[]
  | NodeList
  | DomBindingReturnValue[];
(props: TemplateProps, oldValue: Nodes[]) => DomBindingReturnValue;
```

```js
html`
  <div>
    ${({ name }) => name}
  </div>
`;
```

#### 2. Attribute bindings

```js
html`
  <div name=${({ name }) => name}></div>
`;
```

Attribute name on div will have value = `name` from props passed

#### 3. Prop Bindings

- Normal prop bindings (prefixed with `:`)

return value of binding function is used

```js
html`
  <div id="divElement" :name=${({ name }) => name}></div>
`;

// now
document.querySelector('#divElement').name === props.name;
```

Prop name on div will have value = `name` from props passed.

- direct prop bindings (prefixed with `::`)

Sometimes you want to set prop value directly to the function given (for e.g. you want to set `onclick` prop on that element to the function provided).
Here you can use direct prop bindings

```js
html`
  <div id="divElement" ::onclick=${event => console.log(event.target)}></div>
`;
```

here `div.onclick` will be equal to `event => console.log(event.target)`. Now click on this div will fire this function with click event.

### Advanced Usage

#### Using another template in binding

maybe you want to break a template into two parts that uses same props

```JavaScript
const HTML1 = html`
  <p>Name: ${({ name }) => name}</p>
`;

const HTML2 = html`
  <p>Address: ${({ address }) => address}</p>
`;

// combine
const CombinedHTML = html`
<div>
  <h4>User Info</h4>
  ${HTML1} // All props to `CombinedHTML` will be passed down to `HTML1` and `HTML2`
  ${HTML2}
</div>
`

// rendering
const renderHtml = CombinedHTML({ name: 'Aaditya', address: 'Tokyo' });
```

OR render a template inside another template

```JavaScript
const HTML1 = html`
  <p>Name: ${({ name }) => name}</p>
`;

const HTML2 = html`
  <p>Address: ${({ address }) => address}</p>
`;

// combine
const CombinedHTML = html`
<div>
  <h4>User Info</h4>
  ${({ firstName, lastName }) => HTML1({ name: firstName + lastName })} // pass modified props
  ${({ city, country }) => HTML2({ address: city + ',' + country })}
</div>
`

// rendering
const renderHtml = CombinedHTML({ firstName: 'Aaditya', lastName: 'Taparia', city: 'Tokyo', country: 'Japan' });
```

##### Optimizing Performance

By default new template instance will be created whenever CombinedHTML is updated. But since we are only changing props, we can reuse old rendered template and update that.
This is much more performant, since it only updates dom where needed, instead of replacing everything and creating new dom nodes.
You can do this by passing oldValue to template creator functions, and it will update old template if present else create new template.

```js
// combine
const CombinedHTML = html`

<div>
  <h4>User Info</h4>
  ${({ firstName, lastName }, oldValue) => HTML1({ name: firstName + lastName }, oldValue)} // pass modified props
  ${({ city, country }, oldValue) => HTML2({ address: city + ',' + country }, oldValue)}
</div>
```

This was already handled in first case where you were directly giving template creator function in binding `${HTML1}`

#### CSS - special template

```js
import { html, css, update } from '@sifrr/template';

const CSSForTemplate = css`
  p {
    color: ${({ color }) => color};
  }
`;

const HTML = html`
  ${CSSForTemplate} // all props from HTML will be passed down to CSSForTemplate when rendering just
  // like any other template
  <p>This text will be of ${({ color }) => color} color</p>
`;

const para = HTML({ color: 'red' });
// renders
// <style> --> style tags are automatically added
// p {
//   color: red;
// }
// </style>
// <p>This text will be of red color</p>

// updating
update(para, { color: 'blue' }); // you can guess what will happen
```

#### For Loop

- Normal

```js
import { html, css, update } from '@sifrr/template';

const Row = html`
  <tr>
    <td>${({ id }) => id}</td>
  </tr>
`;

// un-optimized
const Table = html`
  <table>
    ${({ data = [] }, oldValue) => data.map(d => Row(d))}
  </table>
`;

// optimized
const Table = html`
  <table>
    ${({ data = [] }, oldValue) => data.map((d, i) => Row(d, oldValue[i]))}
  </table>
`;

Table({ data: [{ id: '1' }, { id: '2' }] });
// will render
// <table>
//  <tr>
//  <td>1</td>
//  </tr>
//  <tr>
//  <td>2</td>
//  </tr>
// </table>
// when you update this instance with new data
// it will render update old rows if present, and add/remove rows if needed
```

- Non keyed (more performant than looping yourself)

```js
import { html, css, update, bindFor } from '@sifrr/template';

const Row = html`
  <tr>
    <td>${({ id }) => id}</td>
  </tr>
`;

const Table = html`
  <table>
    ${({ data = [] }, oldValue) => bindFor(Row, data, oldValue)}
  </table>
`;

Table({ data: [{ id: '1' }, { id: '2' }] });
// will render
// <table>
//  <tr>
//  <td>1</td>
//  </tr>
//  <tr>
//  <td>2</td>
//  </tr>
// </table>
// when you update this instance with new data
// it will render update old rows if present, and add/remove rows if needed
```

- Keyed (read more about keyed updates [here](https://reactjs.org/docs/reconciliation.html#keys))

Provide key prop to all data (equivalent to react's `key` prop)

```js
import { html, css, update, bindForKeyed } from '@sifrr/template';

const Row = html`
  <tr>
    <td>${({ id }) => id}</td>
  </tr>
`;

const Table = html`
  <table>
    ${({ data = [] }, oldValue) => bindForKeyed(Row, data, oldValue)}
  </table>
`;

Table({
  data: [
    { id: '1', key: 1 },
    { id: '2', key: 2 }
  ]
});
// will render
// <table>
//  <tr>
//  <td>1</td>
//  </tr>
//  <tr>
//  <td>2</td>
//  </tr>
// </table>
// but when you update this instance with new data
// it will reuse nodes with same key, and add/remove/update if needed
```