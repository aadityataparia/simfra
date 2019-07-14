const { App, writeHeaders } = require('@sifrr/server');

const server = new App();

server.get('/404', res => {
  res.writeStatus('404 Not Found');
  res.end();
});

server.post('/post', async res => {
  res.onAborted(global.console.error);
  const body = await res.body();
  writeHeaders(res, {
    'content-type': 'application/json'
  });
  res.end(body);
});

server.get('timeout', async res => {
  res.onAborted(global.console.error);
  await new Promise(res => setTimeout(res, 1000));
  res.end('');
});

module.exports = server;
