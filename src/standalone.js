import 'dotenv/config';
import puppeteer from 'puppeteer';
import { CaptchaClient, Tasks } from '@captcha-solver-api/javascript-sdk';

const apiKey = process.env.CAPTCHA_API_KEY;
const targetUrl = process.env.TARGET_URL || 'http://127.0.0.1:3000';
const headless = process.env.HEADLESS !== 'false';

if (!apiKey) {
  throw new Error('Set CAPTCHA_API_KEY before running the solver example.');
}

const browser = await puppeteer.launch({ headless });

try {
  const page = await browser.newPage();
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await page.waitForSelector('[data-sitekey]');

  const websiteKey = await page.$eval('[data-sitekey]', (element) => element.dataset.sitekey);
  const client = new CaptchaClient({ clientKey: apiKey });
  const solution = await client.solve(
    new Tasks.TurnstileProxyless({
      websiteURL: targetUrl,
      websiteKey
    })
  );

  if (solution.userAgent) {
    await page.setUserAgent(solution.userAgent);
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForFunction(() => typeof window.onTurnstileSolved === 'function');
  }

  await page.evaluate((token) => window.onTurnstileSolved(token), solution.token);
  await page.click('#submit-button');
  await page.waitForFunction(() => document.querySelector('#verification')?.dataset.success);

  const result = await page.$eval('#verification', (element) => ({
    success: element.dataset.success === 'true',
    message: element.textContent
  }));
  console.log(result);

  if (!result.success) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
