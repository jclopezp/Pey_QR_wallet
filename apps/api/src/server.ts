import { buildApp } from './app';
import { loadConfig } from './config';
import { start } from './integrations/pey/startup';

const config = loadConfig();
const app = buildApp({ logger: true });

// Build the Pey client before listening so live mode without a key never opens the port.
start(
  {
    PEY_MODE: config.PEY_MODE,
    PEY_API_KEY: config.PEY_API_KEY,
    PEY_BASE_URL: config.PEY_BASE_URL,
    logger: {
      info(fields) {
        app.log.info({
          method: fields.method,
          path: fields.path,
          status: fields.status,
          durationMs: fields.durationMs,
        });
      },
    },
  },
  async () => {
    await app.listen({ port: config.PORT, host: '127.0.0.1' });
  },
).catch((error: unknown) => {
  app.log.error(error);
  process.exit(1);
});
