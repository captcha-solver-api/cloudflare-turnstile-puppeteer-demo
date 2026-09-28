import 'dotenv/config';
import { spawn } from 'node:child_process';

const targetUrl = process.env.TARGET_URL || 'http://127.0.0.1:3000';
const localUrl = new URL(targetUrl);

if (!['127.0.0.1', 'localhost'].includes(localUrl.hostname)) {
  const solver = spawn(process.execPath, ['src/standalone.js'], { stdio: 'inherit' });
  const exitCode = await new Promise((resolve) => solver.once('exit', resolve));
  process.exitCode = exitCode ?? 1;
} else {
  const server = spawn(process.execPath, ['demo/server.js'], { stdio: 'inherit' });

  try {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try {
        const response = await fetch(new URL('/health', targetUrl));
        if (response.ok) break;
      } catch {
        // The server is still starting.
      }

      if (attempt === 49) {
        throw new Error(`The local demo did not start at ${targetUrl}.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const solver = spawn(process.execPath, ['src/standalone.js'], { stdio: 'inherit' });
    const exitCode = await new Promise((resolve) => solver.once('exit', resolve));
    process.exitCode = exitCode ?? 1;
  } finally {
    server.kill();
  }
}
