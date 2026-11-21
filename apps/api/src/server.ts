import { randomUUID } from 'node:crypto';
import { buildApp } from './app';
import { loadConfig } from './config';
import { ensureDevBusiness, openDatabase } from './db/bank-account-db';

const config = loadConfig();
const db = openDatabase(config.DATABASE_URL);
const devUserId = config.NODE_ENV === 'production' ? undefined : process.env.DEV_USER_ID;
if (devUserId) ensureDevBusiness(db, devUserId);

const app = buildApp({
  logger: true,
  bankAccount: {
    db,
    pey: {
      async createBankAccount() {
        return { id: `mock_${randomUUID()}`, codiStatus: 'PENDING' as const };
      },
    },
    resolveUser: () => devUserId ?? null,
  },
});

app.listen({ port: config.PORT, host: '127.0.0.1' }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
