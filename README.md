![Captcha Solver Turnstile Puppeteer Demo](assets/cloudflare-turnstile-banner.png)

# Cloudflare Challenge Demo

## About

Demo showing how to solve a Cloudflare Challenge page with Turnstile using Puppeteer and the official [Captcha Solver JavaScript SDK](https://github.com/captcha-solver-api/javascript-sdk).

## How It Works

1. Puppeteer opens the protected page specified in `TARGET_URL`.
2. The injected script intercepts `sitekey`, `cData`, `chlPageData`, `action`, the current browser User-Agent, and the callback.
3. The JavaScript SDK sends a `TurnstileProxyless` task to Captcha Solver.
4. The returned token is passed to the intercepted callback.

The browser keeps its original User-Agent throughout the flow. The demo does not
replace it with `solution.userAgent` after the challenge has loaded.

## Usage

Clone and install:

```bash
git clone https://github.com/captcha-solver-api/cloudflare-turnstile-puppeteer-demo.git
cd cloudflare-turnstile-puppeteer-demo
npm install
```

Create `.env` on Windows CMD:

```cmd
copy .env.example .env
```

Linux and macOS:

```bash
cp .env.example .env
```

Add your Captcha Solver API key and the production page where you need to solve
Cloudflare Challenge:

```dotenv
CAPTCHA_API_KEY=your_captcha_solver_api_key
TARGET_URL=https://your-site.example/protected-page
HEADLESS=false
```

`TARGET_URL` is required. Use the full URL of your own production page that
loads Cloudflare Challenge. The repository does not include or depend on a
third-party demo page.

Run the demo:

```bash
npm start
```

The browser opens in visible mode by default. The request to Captcha Solver is real and uses account balance.

An HTTP 403 response with the title `Just a moment...` is the expected Cloudflare Challenge page. A separate `Attention Required` block page means the target rejected the current network before Turnstile loaded.

## Tests

```bash
npm test
```

## License

This project is licensed under the [MIT License](LICENSE).
