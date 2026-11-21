import { describe, expect, it } from 'vitest';
import { amountCentsToPey } from './money';

describe('amountCentsToPey', () => {
  it('serializes cents as a two-decimal MXN number', () => {
    expect(amountCentsToPey(0)).toBe(0);
    expect(JSON.stringify(amountCentsToPey(1))).toBe('0.01');
    expect(JSON.stringify(amountCentsToPey(10))).toBe('0.1');
    expect(JSON.stringify(amountCentsToPey(15050))).toBe('150.5');
    expect(JSON.stringify(amountCentsToPey(15000))).toBe('150');
  });

  it('rejects non-integers and negatives', () => {
    expect(() => amountCentsToPey(1.5)).toThrow(RangeError);
    expect(() => amountCentsToPey(-1)).toThrow(RangeError);
  });
});
