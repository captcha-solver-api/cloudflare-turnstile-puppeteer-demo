# Cloudflare Turnstile Puppeteer Demo

## About

Demo showing how to solve a standalone Cloudflare Turnstile widget with Puppeteer and the official [Captcha Solver JavaScript SDK](https://github.com/captcha-solver-api/javascript-sdk).

The repository includes a local test page with Cloudflare's public test keys.

## How It Works

1. Puppeteer opens the local Turnstile page.
2. The script reads the sitekey from the page.
3. The JavaScript SDK sends a `TurnstileProxyless` task to Captcha Solver.
4. The returned token is passed to the page callback.
5. The local server verifies the token through Cloudflare's `siteverify` endpoint.

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

Add your Captcha Solver API key:

```dotenv
CAPTCHA_API_KEY=your_captcha_solver_api_key
TARGET_URL=http://127.0.0.1:3000
HEADLESS=true
```

Run the demo:

```bash
npm start
```

The command starts the local page, waits until it is ready, runs Puppeteer, and stops the local server when the example is complete.

Expected result:

```text
{ success: true, message: 'Verification passed.' }
```

To run the two processes separately for debugging, use two terminals:

```bash
npm run start:server
npm run solve
```

## Test Keys

The local page uses Cloudflare's public test sitekey and secret key. They verify the integration flow but do not reproduce a production Cloudflare Challenge Page.

The request to Captcha Solver is real and may use account balance.

## Tests

```bash
npm test
```

## License

This project is licensed under the [MIT License](LICENSE).
