import express from 'express';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';

export function createApp({ fetchImpl = fetch } = {}) {
  const app = express();
  const directory = path.dirname(fileURLToPath(import.meta.url));

  app.use(express.json());
  app.use(express.static(directory));
  app.get('/health', (_request, response) => response.json({ status: 'ok' }));

  app.post('/api/verify', async (request, response) => {
    const token = request.body?.token;
    if (!token) {
      return response.status(400).json({ success: false, error: 'Token is required.' });
    }

    try {
      const form = new URLSearchParams({
        secret: TURNSTILE_TEST_SECRET,
        response: token
      });
      const verification = await fetchImpl(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        { method: 'POST', body: form }
      );
      const result = await verification.json();
      return response.status(result.success ? 200 : 422).json({
        success: Boolean(result.success),
        error: result.success ? null : (result['error-codes'] || ['Verification failed.']).join(', ')
      });
    } catch (error) {
      return response.status(502).json({ success: false, error: error.message });
    }
  });

  return app;
}

const isEntryPoint = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntryPoint) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, '127.0.0.1', () => {
    console.log(`Turnstile demo: http://127.0.0.1:${port}`);
  });
}
