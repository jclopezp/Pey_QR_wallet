import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

const SECRETS = ['PEY_API_KEY', 'PEY_WEBHOOK_SECRET', 'SESSION_SECRET'];
const REQUIRED = [...SECRETS, 'PEY_BASE_URL', 'DATABASE_URL'];

function parseEnv(text: string) {
  return Object.fromEntries(
    text
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)] as const;
      }),
  );
}

describe('.env.example', () => {
  const env = parseEnv(read('.env.example'));

  it('lists every required variable', () => {
    for (const key of REQUIRED) expect(env).toHaveProperty(key);
  });

  it('has no real values for secrets', () => {
    for (const key of SECRETS) expect(env[key]).toBe('');
  });

  it('has no credential-like values anywhere', () => {
    const allowed = ['NODE_ENV', 'PORT', 'PEY_MODE', 'PEY_BASE_URL', 'DATABASE_URL'];
    for (const [key, value] of Object.entries(env)) {
      if (!allowed.includes(key)) expect(value, key).toBe('');
    }
  });

  it('never exposes server variables to the browser', () => {
    expect(Object.keys(env).filter((key) => key.startsWith('VITE_'))).toEqual([]);
  });
});

describe('.gitignore', () => {
  const root = new URL('..', import.meta.url).pathname;
  const ignored = (file: string) => {
    try {
      execFileSync('git', ['check-ignore', '-q', file], { cwd: root });
      return true;
    } catch {
      return false;
    }
  };

  it('git ignores .env and .env.* variants', () => {
    expect(ignored('.env')).toBe(true);
    expect(ignored('.env.local')).toBe(true);
  });

  it('keeps .env.example tracked', () => {
    expect(ignored('.env.example')).toBe(false);
  });
});
