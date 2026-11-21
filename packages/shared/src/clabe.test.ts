import { describe, expect, it } from 'vitest';
import { isValidClabe as isValidClabeFromIndex } from './index';
import { isValidClabe } from './clabe';

describe('isValidClabe', () => {
  it('accepts the Pey example CLABE', () => {
    expect(isValidClabe('012180001234567899')).toBe(true);
  });

  it('accepts a check digit of 0', () => {
    expect(isValidClabe('000000000000000000')).toBe(true);
    expect(isValidClabeFromIndex('000000000000000000')).toBe(true);
  });

  it('rejects a bad check digit, the wrong length, and non-digits', () => {
    expect(isValidClabe('012180001234567890')).toBe(false);
    expect(isValidClabe('01218000123456789')).toBe(false);
    expect(isValidClabe('0121800012345678999')).toBe(false);
    expect(isValidClabe('01218000123456789A')).toBe(false);
  });

  it('does not strip spaces', () => {
    expect(isValidClabe('012180001234567899 ')).toBe(false);
    expect(isValidClabe(' 012180001234567899')).toBe(false);
    expect(isValidClabe('0121 8000 1234 567899')).toBe(false);
    expect(isValidClabe('')).toBe(false);
  });
});
