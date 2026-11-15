import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

const base = {
  PEY_BASE_URL: 'https://api.pey.mx',
  DATABASE_URL: './data/buzzqr.db',
};

describe('loadConfig', () => {
  it('applies defaults for local development', () => {
    const config = loadConfig(base);
    expect(config.PORT).toBe(3001);
    expect(config.NODE_ENV).toBe('development');
  });

  it('fails fast when a required variable is missing', () => {
    expect(() => loadConfig({ DATABASE_URL: base.DATABASE_URL })).toThrow(/PEY_BASE_URL/);
  });

  it('requires the secrets in production and never prints values', () => {
    const env = { ...base, NODE_ENV: 'production', PEY_API_KEY: 'super-secret' };
    expect(() => loadConfig(env)).toThrow(/PEY_WEBHOOK_SECRET/);
    expect(() => loadConfig(env)).not.toThrow(/super-secret/);
  });
});
