import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';
import { CaptchaClient, Tasks } from '@captcha-solver-api/javascript-sdk';
import { normalizeUserAgent } from './normalize-ua.js';

const apiKey = process.env.CAPTCHA_API_KEY;
const targetUrl = process.env.TARGET_URL;

if (!apiKey || !targetUrl) {
  throw new Error('Set CAPTCHA_API_KEY and TARGET_URL before running the demo.');
}

const client = new CaptchaClient({ clientKey: apiKey });
const initialUserAgent = await normalizeUserAgent();
const browser = await puppeteer.launch({
  headless: false,
  devtools: true,
  args: [`--user-agent=${initialUserAgent}`, '--no-sandbox']
});

const [page] = await browser.pages();
const injectScript = readFileSync(new URL('./inject.js', import.meta.url), 'utf8');
await page.evaluateOnNewDocument(injectScript);

page.on('console', async (message) => {
  const text = message.text();
  if (!text.startsWith('intercepted-params:')) return;

  const params = JSON.parse(text.slice('intercepted-params:'.length));

  try {
    console.log('Solving the captcha...');
    const task = new Tasks.GenericTask({ type: 'TurnstileTaskProxyless', ...params });
    const solution = await client.solve(task);
    console.log('Captcha solved.');

    await page.evaluate((token) => {
      window.cfCallback(token);
    }, solution.token);
  } catch (error) {
    console.error(error);
    await browser.close();
    process.exitCode = 1;
  }
});

await page.goto(targetUrl);
