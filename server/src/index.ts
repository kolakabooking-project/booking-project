import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║   🚗 BOOKOLAKA API Server                       ║
  ║                                                  ║
  ║   Port:        ${String(env.PORT).padEnd(33)}║
  ║   Environment: ${env.NODE_ENV.padEnd(33)}║
  ║   Auth URL:    ${env.BETTER_AUTH_URL.padEnd(33)}║
  ║                                                  ║
  ║   Health:  http://localhost:${env.PORT}/api/health  ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});
