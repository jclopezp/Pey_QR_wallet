import { HealthResponseSchema } from '@buzzqr/shared';
import { describe, expect, it } from 'vitest';
import { buildApp } from './app';

describe('GET /health', () => {
  it('returns 200 with the shared health payload', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(HealthResponseSchema.safeParse(response.json()).success).toBe(true);
    await app.close();
  });
});
