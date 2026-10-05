import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';
import { CaptchaClient, Tasks } from '@captcha-solver-api/javascript-sdk';
import { normalizeUserAgent } from './normalize-ua.js';

const apiKey = process.env.CAPTCHA_API_KEY;
const targetUrl = process.env.TARGET_URL;

console.log('Started');

if (!apiKey || !targetUrl) {
  console.error('An error occurred: Set CAPTCHA_API_KEY and TARGET_URL before running the demo.');
  console.error('Failed to solve captcha');
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
let challengeHandled = false;

page.on('console', async (message) => {
  const text = message.text();
  if (!text.startsWith('intercepted-params:') || challengeHandled) return;
  challengeHandled = true;

  const params = JSON.parse(text.slice('intercepted-params:'.length));

  try {
    console.log('Parameters received');
    console.log(JSON.stringify(params, null, 2));
    console.log('Solving the captcha...');
    const task = new Tasks.GenericTask({ type: 'TurnstileTaskProxyless', ...params });
    const solution = await client.solve(task);
    console.log('Captcha solved');
    console.log('API response:');
    console.log(JSON.stringify(solution, null, 2));

    await page.evaluate((token) => {
      window.cfCallback(token);
    }, solution.token);
    console.log('The token is sent to the callback function');
    console.log('Finished');
  } catch (error) {
    console.error(`An error occurred: ${error instanceof Error ? error.message : error}`);
    console.error('Failed to solve captcha');
    await browser.close();
    process.exitCode = 1;
  }
});

await page.goto(targetUrl);
console.log(`Target page opened: ${targetUrl}`);
