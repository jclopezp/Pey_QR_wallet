import { z } from 'zod';

export const bankAccountHolderTypes = ['person', 'company'] as const;
export const bankAccountStatuses = ['none', 'pending', 'active', 'rejected'] as const;

export const bankAccountInputSchema = z
  .object({
    alias: z.string().trim().min(1).max(255),
    holderName: z.string().trim().min(1).max(255),
    holderType: z.enum(bankAccountHolderTypes),
    clabe: z.string().regex(/^\d{18}$/),
  })
  .strict();

export type BankAccountInput = z.infer<typeof bankAccountInputSchema>;

export type BankAccountView = {
  alias: string | null;
  holderName: string | null;
  holderType: (typeof bankAccountHolderTypes)[number] | null;
  clabeLast4: string | null;
  status: (typeof bankAccountStatuses)[number];
};

export const bankAccountErrorCodes = [
  'invalid_clabe',
  'invalid_input',
  'bank_not_supported',
  'account_already_registered',
  'pey_unavailable',
  'pey_unknown',
  'unauthenticated',
  'business_not_found',
] as const;

export type BankAccountErrorCode = (typeof bankAccountErrorCodes)[number];
