# Cloudflare Turnstile Puppeteer Demo

This private prototype shows how to use Puppeteer with the official [Captcha Solver JavaScript SDK](https://github.com/captcha-solver-api/javascript-sdk) on a standalone Cloudflare Turnstile widget.

The bundled page uses Cloudflare's public test keys and runs on `localhost`. It is safe for development and does not require a private Cloudflare secret.

## What the demo covers

1. Start a local page with an interactive Turnstile test widget.
2. Open the page with Puppeteer.
3. Read `websiteURL` and `websiteKey` from the page.
4. Create `TurnstileProxyless` through the Captcha Solver JavaScript SDK.
5. Pass the returned token to the page callback.
6. Submit the token for server-side verification.

## Requirements

- Node.js 22.12 or newer;
- a Captcha Solver account with a positive balance;
- a valid `CAPTCHA_API_KEY`.

## Installation

```bash
git clone git@github.com:captcha-solver-api/cloudflare-turnstile-puppeteer-demo.git
cd cloudflare-turnstile-puppeteer-demo
npm install
cp .env.example .env
```

Set your Captcha Solver key in `.env`:

```dotenv
CAPTCHA_API_KEY=your_captcha_solver_api_key
TARGET_URL=http://127.0.0.1:3000
HEADLESS=true
```

The `.env` file is ignored by Git.

## Run the local demo

Start the test page:

```bash
npm start
```

In another terminal, run the Puppeteer example:

```bash
npm run solve
```

Set `HEADLESS=false` to watch the browser.

## Public Turnstile test keys

The local page uses Cloudflare's documented public keys:

- sitekey `3x00000000000000000000FF` forces an interactive test challenge;
- secret key `1x0000000000000000000000000000000AA` always returns successful test validation for a dummy token.

These keys can be used on `localhost` and other development domains. They are not production credentials.

## Important limitation

Cloudflare test keys return predictable dummy tokens. This setup validates the browser flow, parameter extraction, callback handling, form submission, and server endpoint. It does not measure real-world solve quality.

For a live test, set `TARGET_URL` to a page you own or are authorized to test. The current prototype supports a standalone Turnstile widget. A Cloudflare Challenge Page requires a separate domain behind Cloudflare and a configured challenge rule, so that scenario is intentionally outside this first version.

## Tests

```bash
npm test
```

The automated tests cover the local server without spending Captcha Solver balance or sending requests to Cloudflare.

## References

- [Captcha Solver JavaScript SDK](https://github.com/captcha-solver-api/javascript-sdk)
- [Cloudflare Turnstile testing documentation](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)

## License

MIT
