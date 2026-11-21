import { describe, expect, it } from 'vitest';
import { HealthResponseSchema } from './health';

describe('HealthResponseSchema', () => {
  it('accepts the health payload', () => {
    expect(HealthResponseSchema.parse({ status: 'ok' })).toEqual({ status: 'ok' });
  });

  it('rejects any other status', () => {
    expect(HealthResponseSchema.safeParse({ status: 'down' }).success).toBe(false);
  });
});
