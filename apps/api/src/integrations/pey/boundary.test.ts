import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist') {
      continue;
    }
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...sourceFiles(full));
      continue;
    }
    if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

describe('Pey client boundary', () => {
  it('is not imported by the web app or the shared package', () => {
    const root = path.resolve(import.meta.dirname, '../../../../../');
    const files = [
      ...sourceFiles(path.join(root, 'apps/web')),
      ...sourceFiles(path.join(root, 'packages/shared')),
    ];
    const offenders = files.filter((file) =>
      readFileSync(file, 'utf8').includes('integrations/pey'),
    );
    expect(offenders).toEqual([]);
  });
});
