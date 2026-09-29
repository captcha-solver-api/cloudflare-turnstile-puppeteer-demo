import assert from 'node:assert/strict';
import test from 'node:test';
import { createTurnstileTask, isCloudflareChallengeTitle } from '../task.js';

test('maps intercepted challenge parameters to the SDK task', () => {
  const task = createTurnstileTask({
    websiteURL: 'https://example.com/challenge',
    websiteKey: 'sitekey',
    action: 'managed',
    data: 'cdata',
    pagedata: 'page-data',
    userAgent: 'Mozilla/5.0 test'
  });

  assert.deepEqual(task.toDict(), {
    type: 'TurnstileTaskProxyless',
    websiteURL: 'https://example.com/challenge',
    websiteKey: 'sitekey',
    action: 'managed',
    data: 'cdata',
    pagedata: 'page-data',
    userAgent: 'Mozilla/5.0 test'
  });
});

test('recognizes English and Russian Cloudflare challenge titles', () => {
  assert.equal(isCloudflareChallengeTitle('Just a moment...'), true);
  assert.equal(isCloudflareChallengeTitle('Один момент…'), true);
  assert.equal(isCloudflareChallengeTitle('Cloudflare Turnstile demo'), false);
});
