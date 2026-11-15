export type CreateQrInput = {
  amountCents: number
  concept?: string
  bankAccountId: string
  metadata: { qrId: string; businessId: string }
}

export type CreateQrResult = { peyQrId: string; qrString: string }

export type CreateBankAccountInput = {
  alias: string
  name: string
  clabe: string
  entity: 'PERSON' | 'BUSINESS'
}

export type CreateBankAccountResult = {
  id: string
  codiStatus: 'PENDING' | 'PROCESSING' | 'ACTIVE' | 'ERROR'
}

export type BankAccountResult = CreateBankAccountResult & {
  alias: string
  name: string
  clabe: string
  entity: 'PERSON' | 'BUSINESS'
  errorMessage?: string
}

export interface PeyClient {
  createQr(input: CreateQrInput): Promise<CreateQrResult>
  createBankAccount(input: CreateBankAccountInput): Promise<CreateBankAccountResult>
  getBankAccount(id: string): Promise<BankAccountResult>
}
