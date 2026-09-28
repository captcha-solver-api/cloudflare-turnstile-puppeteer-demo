import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from '../demo/server.js';

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint is available', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('verification endpoint rejects an empty token', async () => {
  const response = await fetch(`${baseUrl}/api/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { success: false, error: 'Token is required.' });
});

test('verification endpoint returns the Cloudflare response', async () => {
  const fetchImpl = async () => ({
    json: async () => ({ success: true })
  });
  const isolatedServer = createApp({ fetchImpl }).listen(0, '127.0.0.1');
  await new Promise((resolve) => isolatedServer.once('listening', resolve));
  const address = isolatedServer.address();

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'XXXX.DUMMY.TOKEN.XXXX' })
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, error: null });
  } finally {
    await new Promise((resolve, reject) => isolatedServer.close((error) => error ? reject(error) : resolve()));
  }
});
