import { describe, expect, it } from 'vitest';
import { bankAccountInputSchema } from './bank-account';

const valid = {
  alias: 'BBVA',
  holderName: 'Ana López',
  holderType: 'company',
  clabe: '012180001234567899',
};

describe('bankAccountInputSchema', () => {
  it('accepts the registration fields', () => {
    expect(bankAccountInputSchema.parse(valid)).toEqual(valid);
  });

  it('trims the alias and the holder name', () => {
    expect(bankAccountInputSchema.parse({ ...valid, alias: '  BBVA  ' }).alias).toBe('BBVA');
  });

  it('rejects an extra field, a short CLABE, and an unknown holder type', () => {
    expect(bankAccountInputSchema.safeParse({ ...valid, businessId: 'other' }).success).toBe(false);
    expect(bankAccountInputSchema.safeParse({ ...valid, clabe: '01218000123456789' }).success).toBe(
      false,
    );
    expect(bankAccountInputSchema.safeParse({ ...valid, holderType: 'ngo' }).success).toBe(false);
    expect(bankAccountInputSchema.safeParse({ ...valid, alias: '   ' }).success).toBe(false);
  });
});
