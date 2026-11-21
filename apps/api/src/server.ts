import { buildApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();
const app = buildApp({ logger: true });

app.listen({ port: config.PORT, host: '127.0.0.1' }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
