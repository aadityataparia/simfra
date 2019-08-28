(function () {
  'use strict';

  var livereloadjs = path => {
    var ws,
        ttr = 500,
        timeout;
    function newWsConnection() {
      ws = new WebSocket(path);
      ws.onopen = function () {
        ttr = 500;
        checkMessage();
        console.log('watching for file changes through sifrr-server livereload mode.');
      };
      ws.onmessage = function (event) {
        if (JSON.parse(event.data)) {
          console.log('Files changed, refreshing page.');
          location.reload();
        }
      };
      ws.onerror = e => {
        console.error('Webosocket error: ', e);
        console.log('Retrying after ', ttr / 4, 'ms');
        ttr *= 4;
      };
      ws.onclose = e => {
        console.error("Webosocket closed with code ".concat(e.code, " error ").concat(e.message));
      };
    }
    function checkMessage() {
      if (!ws) return;
      if (ws.readyState === WebSocket.OPEN) ws.send('');else if (ws.readyState === WebSocket.CLOSED) newWsConnection();
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(checkMessage, ttr);
    }
    newWsConnection();
    setTimeout(checkMessage, ttr);
  };

  var loc = window.location;
  var uri;
  if (loc.protocol === 'https:') {
    uri = 'wss:';
  } else {
    uri = 'ws:';
  }
  uri += '//' + loc.host + '/livereload';
  livereloadjs(uri);

}());
//# sourceMappingURL=livereload.js.map
