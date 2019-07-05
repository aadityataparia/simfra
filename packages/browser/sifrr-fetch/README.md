# sifrr-fetch · [![npm version](https://img.shields.io/npm/v/@sifrr/fetch.svg)](https://www.npmjs.com/package/@sifrr/fetch) [![Doscify](https://img.shields.io/badge/API%20docs-Docsify-red.svg)](https://sifrr.github.io/sifrr/#/./packages/browser/sifrr-fetch/)

> Fetch API and websockets API based small, easy to use, promise based requests library for browsers.

## Size

| Type                                           |                                                                                                                          Size                                                                                                                          |
| :--------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| Normal (`dist/sifrr.fetch.js`)                 |                   [![Normal](https://img.badgesize.io/sifrr/sifrr/master/packages/browser/sifrr-fetch/dist/sifrr.fetch.js?maxAge=600)](https://github.com/sifrr/sifrr/blob/master/packages/browser/sifrr-fetch/dist/sifrr.fetch.js)                    |
| Minified (`dist/sifrr.fetch.min.js`)           |              [![Minified](https://img.badgesize.io/sifrr/sifrr/master/packages/browser/sifrr-fetch/dist/sifrr.fetch.min.js?maxAge=600)](https://github.com/sifrr/sifrr/blob/master/packages/browser/sifrr-fetch/dist/sifrr.fetch.min.js)               |
| Minified + Gzipped (`dist/sifrr.fetch.min.js`) | [![Minified + Gzipped](https://img.badgesize.io/sifrr/sifrr/master/packages/browser/sifrr-fetch/dist/sifrr.fetch.min.js?compression=gzip&maxAge=600)](https://github.com/sifrr/sifrr/blob/master/packages/browser/sifrr-fetch/dist/sifrr.fetch.min.js) |

## How to use

### Directly in Browser using standalone distribution

Add script tag in your website.

```html
<script src="https://unpkg.com/@sifrr/fetch@{version}/dist/sifrr.fetch.min.js"></script>
```

#### Browser API support needed for

| APIs         | caniuse                              | polyfills                                     |
| :----------- | :----------------------------------- | :-------------------------------------------- |
| Fetch API    | <https://caniuse.com/#feat=fetch>    | <https://github.com/github/fetch>             |
| Promises API | <https://caniuse.com/#feat=promises> | <https://github.com/stefanpenner/es6-promise> |

### Using npm

Do `npm i @sifrr/fetch` or `yarn add @sifrr/fetch` or add the package to your `package.json` file.

example, put in your frontend js module (compatible with webpack/rollup/etc):

#### Commonjs

```js
window.Sifrr = window.Sifrr || {};
window.Sifrr.Fetch = require('@sifrr/fetch');
```

#### ES modules

```js
import Fetch from '@sifrr/fetch';
window.Sifrr = window.Sifrr || {};
window.Sifrr.Fetch = Fetch;
```

#### With node

```js
// set global.fetch
global.fetch = require('node-fetch);
const SFetch = require('@sifrr/fetch');
// use SFetch.get, post etc,
```

**Note**: You can not use websockets with node

## API

### HTTP Requests

**options** are Fetch API options with some extra keys:

- **params** `json object` key, value pairs will be added to url as ?key=value
- **body** `json object | string` body to send with post requests
- **onProgress** `function` if response has content-length, this function will be called with

```js
{
  loaded, // loaded bytes
    total, // total bytes (0 if response doesn't have content length)
    percent, // progress precentage
    speed, // speed in kbps
    value; // chunk value
}
```

- **before** `function` this function will be called with `{ url, options, method }` and should return modified `{ url, options, method }` which will be used to send requests
- **after** `function` this function will be called with `response` and should return modified `response`
- **use** `function` this function will be called with `{ url, options, method }` and resolve/return with response which will be returned, if this function errors, response will be fetched normally (use case: use it as a middleware for cache)

#### GET request

you can add query parameters to get request options.

```js
options.query = { key: 'value' };
Sifrr.Fetch.get(url, options)
  .then(response => {
    // This will send request to url?key=value
    // response is JSON if response has `content-type: application/json` header
    // else it is a Fetch API response object.
  })
  .catch(e => {
    // handle error, same for other type of requests
  });
```

#### PUT request

```js
Sifrr.Fetch.put(url, options).then(response => {
  // response is JSON if response has `content-type: application/json` header
  // else it is a Fetch API response object.
});
```

#### POST request

you can add post request body parameters to post request options.

```js
options.body = { key: 'value' };
options.headers = {
  'content-type': 'aaplication/json'
};
Sifrr.Fetch.post(url, options).then(response => {
  // response is JSON if response has `content-type: application/json` header
  // else it is a Fetch API response object.
});
```

#### DELETE request

```js
Sifrr.Fetch.delete(url, options).then(response => {
  // response is JSON if response has `content-type: application/json` header
  // else it is a Fetch API response object.
});
```

#### GET file request

```js
Sifrr.Fetch.file(url, options).then(response => {
  // response is a Fetch API response object.
  // You can get file text content using response.text() or other fetch response methods
});
```

#### GRAPHQL request

graphql request is a POST request.

```js
Sifrr.Fetch.graphql(url, {
  query: 'graphql query string',
  variables: { a: 'b' },
  ...otherOptions
}).then(response => {
  // response is JSON if response has `content-type: application/json` header
  // else it is a Fetch API response object.
});
```

#### Cache as Middleware

```js
const storage = new Sifrr.Storage();
function cacheOrGet(url) {
  Sifrr.Fetch.get(url, {
    use: url =>
      storage.get(url).then(v => (typeof v[url] === 'undefined' ? throw 'Not found' : v[url])),
    after: response => {
      storage.set(url, response);
      return response;
    }
  });
}
```

## WebSockets

Automatic connection retries, calls fallback on message sending failure/error

### WebSocket fetch

**Note**: Only works with JSON messages/responses

```js
// Open a socket
const socket = Sifrr.Fetch.socket(url, protocols, fallback /* (message) => 'fallback response' */);
// send a message
socket.send(message [, type]).then(resp => {
  // do something
});

// Server will receive data as:
// {
//   sifrrQueryId: Int,
//   sifrrQueryType: type, (default: 'JSON')
//   data: message
// },
// and should send back
// {
//   sifrrQueryId: same id as received
//   data: response
// }
// then resp will be equal to response sent above
//
// If socket connection fails
// It will call fallback function with message and resolves with its return value
```

### Traditional WebSocket messaging

```js
// Open a socket
const socket = Sifrr.Fetch.socket(url, protocols, fallback /* (message) => 'fallback response' */);
// send a message
socket.sendRaw(message);
```

### Hooks

```js
// same as websocket's hooks
socket.onmessage = event => {};
socker.onopen = () => {};
socker.onclose = () => {};
socker.onerror = e => {};
```

## References

- <https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch>
- Response object <https://developer.mozilla.org/en-US/docs/Web/API/Response>
