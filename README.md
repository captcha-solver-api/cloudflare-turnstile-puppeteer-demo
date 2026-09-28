# Cloudflare Turnstile Puppeteer Demo

This private prototype demonstrates the complete integration flow between a browser, the [Captcha Solver JavaScript SDK](https://github.com/captcha-solver-api/javascript-sdk), and a standalone Cloudflare Turnstile widget.

The repository includes its own local test page. It uses Cloudflare's documented public test keys, so no private Cloudflare credentials are required.

## Table of Contents

- [What This Prototype Demonstrates](#what-this-prototype-demonstrates)
- [Limitations](#limitations)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Demo](#running-the-demo)
- [Expected Result](#expected-result)
- [What Is Sent Over the Network](#what-is-sent-over-the-network)
- [Public Turnstile Test Keys](#public-turnstile-test-keys)
- [Using an Authorized Target Page](#using-an-authorized-target-page)
- [Automated Tests](#automated-tests)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [References](#references)

## What This Prototype Demonstrates

The demo checks the complete application flow:

1. A local web server displays a standalone Turnstile widget.
2. Puppeteer opens the page in Chromium.
3. The script reads the Turnstile sitekey from the page.
4. The JavaScript SDK creates a `TurnstileProxyless` task in Captcha Solver.
5. The SDK waits until the task is complete.
6. Puppeteer passes the returned token to the page callback.
7. The page submits the token to the local server.
8. The local server sends it to Cloudflare's `siteverify` endpoint.
9. The verification result is displayed on the page and printed in the terminal.

This verifies that the SDK, Puppeteer integration, callback, form submission, and server-side verification are connected correctly.

## Limitations

This is a controlled integration prototype, not a real Cloudflare Challenge Page test.

It does not test:

- a production Turnstile sitekey;
- Cloudflare's full-page managed challenge;
- real anti-bot rules configured for a protected domain;
- challenge parameters such as `action`, `cData`, and `chlPageData`;
- real-world solve quality or stability.

Cloudflare's public test keys return predictable test behavior. A production-equivalent demo requires a controlled domain behind Cloudflare with a real Turnstile widget or challenge rule.

## How It Works

```text
Puppeteer
    |
    | opens http://127.0.0.1:3000
    v
Local Turnstile page
    |
    | websiteURL + websiteKey
    v
Captcha Solver JavaScript SDK
    |
    | createTask -> polling -> solution
    v
Turnstile token
    |
    | window.onTurnstileSolved(token)
    v
Local page callback
    |
    | POST /api/verify
    v
Local Express server
    |
    | POST Cloudflare siteverify
    v
Verification passed / failed
```

### Step 1: local page

`demo/index.html` loads the official Turnstile client script and renders a widget with Cloudflare's public interactive test sitekey.

### Step 2: parameter extraction

`src/standalone.js` opens the page and reads `data-sitekey` from the Turnstile element. The target URL becomes `websiteURL`, and the extracted sitekey becomes `websiteKey`.

### Step 3: task creation

The script creates the SDK client:

```javascript
const client = new CaptchaClient({ clientKey: apiKey });
```

It then sends a proxyless Turnstile task:

```javascript
const solution = await client.solve(
  new Tasks.TurnstileProxyless({
    websiteURL: targetUrl,
    websiteKey
  })
);
```

The SDK handles task creation and result polling. The solution contains `token` and may also contain the worker's `userAgent`.

### Step 4: token application

Puppeteer calls the callback used by the local page:

```javascript
window.onTurnstileSolved(solution.token);
```

The callback stores the token and enables the **Verify token** button.

### Step 5: server-side verification

After Puppeteer clicks the button, the browser sends the token to `POST /api/verify`. The Express server forwards it to:

```text
https://challenges.cloudflare.com/turnstile/v0/siteverify
```

The page displays the response as `Verification passed.` or `Verification failed`.

## Project Structure

```text
.
├── demo/
│   ├── index.html       # local Turnstile page and callback
│   └── server.js        # Express server and siteverify request
├── src/
│   └── standalone.js    # Puppeteer and Captcha Solver SDK flow
├── test/
│   └── server.test.js   # local server tests
├── .github/workflows/
│   └── tests.yml        # CI configuration
├── .env.example
├── package.json
└── README.md
```

## Requirements

- Node.js 22.12 or newer;
- npm;
- a Captcha Solver account with a positive balance;
- a valid Captcha Solver API key.

Check the installed versions:

```bash
node --version
npm --version
```

## Installation

Clone the private repository:

```bash
git clone https://github.com/captcha-solver-api/cloudflare-turnstile-puppeteer-demo.git
cd cloudflare-turnstile-puppeteer-demo
```

GitHub may open a browser to authorize access to the private repository.

Install dependencies:

```bash
npm install
```

Puppeteer downloads a compatible Chromium build during installation.

### Create the environment file on Windows CMD

```cmd
copy .env.example .env
notepad .env
```

### Create the environment file on PowerShell

```powershell
Copy-Item .env.example .env
notepad .env
```

### Create the environment file on Linux or macOS

```bash
cp .env.example .env
```

## Configuration

Open `.env` and set:

```dotenv
CAPTCHA_API_KEY=your_captcha_solver_api_key
TARGET_URL=http://127.0.0.1:3000
HEADLESS=true
```

| Variable | Required | Description |
| --- | --- | --- |
| `CAPTCHA_API_KEY` | Yes | Captcha Solver account key. |
| `TARGET_URL` | No | Page opened by Puppeteer. Defaults to the local demo. |
| `HEADLESS` | No | `true` runs Chromium in the background; `false` shows the browser. |

The `.env` file is ignored by Git and must never be committed.

## Running the Demo

The demo uses two processes, so keep two terminal windows open.

### Terminal 1: start the local page

From the repository directory:

```bash
npm start
```

Expected output:

```text
Turnstile demo: http://127.0.0.1:3000
```

Keep this terminal running.

You can open `http://127.0.0.1:3000` manually to confirm that the test page is available.

### Terminal 2: run Puppeteer

Open another terminal in the same repository directory:

```bash
npm run solve
```

To watch the browser, set this value in `.env` before running:

```dotenv
HEADLESS=false
```

## Expected Result

The Puppeteer terminal should finish with an object similar to:

```text
{ success: true, message: 'Verification passed.' }
```

On the local page, the status changes in this order:

```text
Waiting for a token.
Token received.
Verifying token...
Verification passed.
```

The Captcha Solver request is real and may consume account balance even though the target uses Cloudflare test keys.

## What Is Sent Over the Network

### Sent to Captcha Solver

- the API key in the authenticated API request;
- `websiteURL`, normally `http://127.0.0.1:3000`;
- the public Turnstile test sitekey;
- task status requests until the solution is ready.

### Returned by Captcha Solver

- the Turnstile token;
- the worker user agent when provided by the API.

### Sent to Cloudflare

The local server sends the returned token and Cloudflare's public test secret to the official `siteverify` endpoint.

The token is not sent to any other target website by this prototype.

## Public Turnstile Test Keys

The repository uses Cloudflare's documented test credentials:

| Key | Value | Behavior |
| --- | --- | --- |
| Sitekey | `3x00000000000000000000FF` | Forces an interactive visible test challenge. |
| Secret key | `1x0000000000000000000000000000000AA` | Returns successful validation for a valid dummy test token. |

Cloudflare intentionally publishes these values. They work on `localhost` and other development domains and are not production credentials.

## Using an Authorized Target Page

You may set `TARGET_URL` to a page that you own or have permission to test. However, changing the URL alone does not make the script universal.

The current token-application code expects the local demo's:

- `window.onTurnstileSolved` callback;
- `#submit-button` element;
- `#verification` result element.

For another page, adapt the selectors and callback logic in `src/standalone.js` to match that page. The task parameters may also require `action`, `data`, or `pagedata`.

Do not run the example against sites without authorization.

## Automated Tests

Run:

```bash
npm test
```

The tests verify:

- the local health endpoint;
- rejection of an empty token;
- handling of a successful mocked Cloudflare response.

Automated tests do not call Captcha Solver, do not call Cloudflare, and do not spend account balance. GitHub Actions runs the same test suite on every push and pull request.

## Troubleshooting

### `npm` is not recognized on Windows

Node.js is missing from `PATH`. Install Node.js 22.12 or newer, reopen the terminal, and check:

```cmd
node --version
npm --version
```

If you use a portable Node.js distribution, add its directory for the current CMD session:

```cmd
set "PATH=C:\path\to\node-v22.23.2-win-x64;%PATH%"
```

### `cp` is not recognized on Windows

Use the Windows command:

```cmd
copy .env.example .env
```

### `Set CAPTCHA_API_KEY before running the solver example`

Create `.env`, add a valid key, save the file, and run `npm run solve` again.

### `ERR_CONNECTION_REFUSED`

Start `npm start` in the first terminal and leave it running before executing `npm run solve`.

### Chromium cannot start

Run `npm install` again without `PUPPETEER_SKIP_DOWNLOAD`. Puppeteer needs its compatible Chromium build for the manual demo.

### Verification fails

Check that:

- the local server is still running;
- the page uses the bundled public test keys;
- the token has not expired;
- Puppeteer applied the token before submitting the form.

## Security Notes

- Never commit `.env`.
- Never place `CAPTCHA_API_KEY` in source code or README examples.
- The bundled Cloudflare sitekey and secret are official public test values, not private credentials.
- Use production Turnstile secrets only on a trusted server.

## References

- [Captcha Solver JavaScript SDK](https://github.com/captcha-solver-api/javascript-sdk)
- [Cloudflare Turnstile testing documentation](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
- [Cloudflare server-side token validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)

## License

MIT
