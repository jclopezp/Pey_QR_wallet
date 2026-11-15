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

  it('never exposes server variables to the browser', () => {
    expect(Object.keys(env).filter((key) => key.startsWith('VITE_'))).toEqual([]);
  });
});

describe('.gitignore', () => {
  it('ignores .env but keeps .env.example', () => {
    const lines = read('.gitignore')
      .split('\n')
      .map((line) => line.trim());
    expect(lines).toContain('.env');
    expect(lines).toContain('!.env.example');
  });
});
