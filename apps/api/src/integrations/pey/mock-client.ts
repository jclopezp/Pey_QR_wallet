import type {
  BankAccountResult,
  CreateBankAccountInput,
  CreateBankAccountResult,
  CreateQrInput,
  CreateQrResult,
  PeyClient,
} from './client';

export class MockPeyClient implements PeyClient {
  lastCreateQr?: CreateQrInput;
  lastCreateBankAccount?: CreateBankAccountInput;

  constructor(private readonly accounts: Record<string, BankAccountResult> = {}) {}

  createQr(input: CreateQrInput): Promise<CreateQrResult> {
    this.lastCreateQr = input;
    return Promise.resolve({ peyQrId: 'mock_qr_1', qrString: '{"TYP":1,"mock":true}' });
  }

  createBankAccount(input: CreateBankAccountInput): Promise<CreateBankAccountResult> {
    this.lastCreateBankAccount = input;
    return Promise.resolve({ id: 'mock_ba_1', codiStatus: 'PENDING' });
  }

  getBankAccount(id: string): Promise<BankAccountResult> {
    return Promise.resolve(
      this.accounts[id] ?? {
        id,
        codiStatus: 'PENDING',
        alias: '',
        name: '',
        clabe: '',
        entity: 'PERSON',
      },
    );
  }
}
