import 'dotenv/config';
import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';
import { CaptchaClient } from '@captcha-solver-api/javascript-sdk';
import { normalizeUserAgent } from './normalize-ua.js';
import { createTurnstileTask, isCloudflareChallengeTitle } from './task.js';

const apiKey = process.env.CAPTCHA_API_KEY;
const targetUrl = process.env.TARGET_URL;
const headless = process.env.HEADLESS === 'true';

if (!apiKey) {
  throw new Error('Set CAPTCHA_API_KEY before running the demo.');
}

if (!targetUrl) {
  throw new Error('Set TARGET_URL to the protected page you want to test.');
}

try {
  new URL(targetUrl);
} catch {
  throw new Error('TARGET_URL must be a valid absolute URL.');
}

const initialUserAgent = await normalizeUserAgent();
const browser = await puppeteer.launch({
  headless,
  devtools: !headless,
  args: [`--user-agent=${initialUserAgent}`, '--no-sandbox']
});

try {
  const [page] = await browser.pages();
  const injectScript = readFileSync(new URL('./inject.js', import.meta.url), 'utf8');
  await page.evaluateOnNewDocument(injectScript);

  let cancelInterceptionTimeout;
  const interceptedParams = new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Turnstile parameters were not intercepted within 60 seconds.')),
      60_000
    );
    cancelInterceptionTimeout = () => clearTimeout(timeout);

    page.on('console', (message) => {
      const text = message.text();
      if (!text.startsWith('intercepted-params:')) return;

      clearTimeout(timeout);
      resolve(JSON.parse(text.slice('intercepted-params:'.length)));
    });
  });

  console.log(`Opening ${targetUrl}`);
  const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const pageTitle = await page.title();
  const isCloudflareChallenge = response?.status() === 403 && isCloudflareChallengeTitle(pageTitle);
  if (!response?.ok() && !isCloudflareChallenge) {
    cancelInterceptionTimeout();
    throw new Error(
      `The target page returned HTTP ${response?.status() ?? 'unknown'} (${pageTitle}). ` +
      'Try another network or an allowed target page.'
    );
  }

  const params = await interceptedParams;
  console.log('Turnstile parameters intercepted.');

  const client = new CaptchaClient({ clientKey: apiKey });
  const solution = await client.solve(createTurnstileTask(params));
  console.log('Turnstile solved.');

  await page.evaluate((token) => {
    if (typeof window.cfCallback !== 'function') {
      throw new Error('Turnstile callback is unavailable.');
    }
    window.cfCallback(token);
  }, solution.token);

  await page.waitForFunction(
    () => !/just a moment|\u043e\u0434\u0438\u043d \u043c\u043e\u043c\u0435\u043d\u0442/i.test(document.title),
    { timeout: 60_000 }
  ).catch(() => undefined);

  const resultTitle = await page.title();
  console.log(`Result page: ${page.url()}`);
  console.log(`Result title: ${resultTitle}`);

  if (isCloudflareChallengeTitle(resultTitle)) {
    throw new Error('The token was submitted, but the Cloudflare Challenge page is still active.');
  }
} finally {
  await browser.close();
}
