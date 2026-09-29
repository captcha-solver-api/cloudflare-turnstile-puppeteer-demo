import puppeteer from 'puppeteer';

export async function normalizeUserAgent() {
  let browser;

  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const userAgent = await browser.userAgent();
    return userAgent.replace('Headless', '').replace('Chromium', 'Chrome');
  } catch {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
  } finally {
    await browser?.close();
  }
}
