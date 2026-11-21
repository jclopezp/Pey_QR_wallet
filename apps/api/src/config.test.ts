import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

const secrets = {
  PEY_API_KEY: 'test-api-key',
  PEY_WEBHOOK_SECRET: 'test-webhook-secret',
  SESSION_SECRET: 'test-session-secret',
};

const base = {
  PEY_BASE_URL: 'https://api.pey.mx',
  DATABASE_URL: './data/buzzqr.db',
  ...secrets,
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

  it.each(Object.keys(secrets))('requires %s in every environment', (key) => {
    for (const NODE_ENV of ['development', 'test', 'production']) {
      expect(() => loadConfig({ ...base, NODE_ENV, [key]: '' })).toThrow(new RegExp(key));
      const without: Record<string, string> = { ...base };
      delete without[key];
      expect(() => loadConfig({ ...without, NODE_ENV })).toThrow(new RegExp(key));
    }
  });

  it('never prints secret values in errors', () => {
    const env = { ...base, PEY_WEBHOOK_SECRET: '', PEY_API_KEY: 'super-secret' };
    expect(() => loadConfig(env)).toThrow(/PEY_WEBHOOK_SECRET/);
    expect(() => loadConfig(env)).not.toThrow(/super-secret/);
  });

  it.each(['ftp://api.pey.mx', 'javascript:alert(1)', 'not a url'])(
    'rejects PEY_BASE_URL %s',
    (PEY_BASE_URL) => {
      expect(() => loadConfig({ ...base, PEY_BASE_URL })).toThrow(/PEY_BASE_URL/);
    },
  );

  it.each(['abc', '0', '-1', '1.5'])('rejects PORT %s', (PORT) => {
    expect(() => loadConfig({ ...base, PORT })).toThrow(/PORT/);
  });

  it('rejects an empty DATABASE_URL', () => {
    expect(() => loadConfig({ ...base, DATABASE_URL: '' })).toThrow(/DATABASE_URL/);
  });
});
