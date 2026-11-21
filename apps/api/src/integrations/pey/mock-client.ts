import type {
  BankAccountResult,
  CreateBankAccountInput,
  CreateBankAccountResult,
  CreateQrInput,
  CreateQrResult,
  PeyClient,
} from './client';
import {
  bankAccountIdSchema,
  createBankAccountRequestSchema,
  createQrRequestSchema,
  readInput,
} from './schemas';

export class MockPeyClient implements PeyClient {
  lastCreateQr?: CreateQrInput;
  lastCreateBankAccount?: CreateBankAccountInput;

  constructor(private readonly accounts: Record<string, BankAccountResult> = {}) {}

  async createQr(input: CreateQrInput): Promise<CreateQrResult> {
    const parsed = readInput(createQrRequestSchema, input);
    this.lastCreateQr = parsed;
    return { peyQrId: 'mock_qr_1', qrString: '{"TYP":1,"mock":true}' };
  }

  async createBankAccount(input: CreateBankAccountInput): Promise<CreateBankAccountResult> {
    const parsed = readInput(createBankAccountRequestSchema, input);
    this.lastCreateBankAccount = parsed;
    return { id: 'mock_ba_1', codiStatus: 'PENDING' };
  }

  async getBankAccount(id: string): Promise<BankAccountResult> {
    const accountId = readInput(bankAccountIdSchema, id);
    return (
      this.accounts[accountId] ?? {
        id: accountId,
        codiStatus: 'PENDING',
        alias: '',
        name: '',
        clabe: '',
        entity: 'PERSON',
      }
    );
  }
}
