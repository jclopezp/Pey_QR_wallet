import { amountCentsToPey } from './money'
import { PeyError } from './errors'
import { createQrResponseSchema } from './schemas'
import type {
  BankAccountResult,
  CreateBankAccountInput,
  CreateBankAccountResult,
  CreateQrInput,
  CreateQrResult,
  PeyClient,
} from './client'

type PeyLogger = { info: (obj: Record<string, unknown>) => void }

export type HttpPeyClientOptions = {
  baseUrl: string
  apiKey: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
  logger?: PeyLogger
}

export class HttpPeyClient implements PeyClient {
  constructor(private readonly options: HttpPeyClientOptions) {}

  async createQr(input: CreateQrInput): Promise<CreateQrResult> {
    const body: Record<string, unknown> = {
      amount: amountCentsToPey(input.amountCents),
      bankAccountId: input.bankAccountId,
      metadata: input.metadata,
    }
    if (input.concept !== undefined) {
      body.concept = input.concept
    }
    const json = await this.request('POST', '/codi/qr', body)
    const parsed = createQrResponseSchema.parse(json)
    return { peyQrId: parsed.id, qrString: parsed.qrString }
  }

  createBankAccount(_input: CreateBankAccountInput): Promise<CreateBankAccountResult> {
    throw new PeyError('pey_unknown')
  }

  getBankAccount(_id: string): Promise<BankAccountResult> {
    throw new PeyError('pey_unknown')
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = new URL(path.replace(/^\//, ''), ensureTrailingSlash(this.options.baseUrl))
    const started = Date.now()
    const fetchImpl = this.options.fetchImpl ?? fetch
    const response = await fetchImpl(url, {
      method,
      headers: {
        authorization: `Bearer ${this.options.apiKey}`,
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(this.options.timeoutMs ?? 10_000),
    })
    this.options.logger?.info({
      method,
      path: url.pathname,
      status: response.status,
      durationMs: Date.now() - started,
    })
    const text = await response.text()
    return text ? JSON.parse(text) : null
  }
}

function ensureTrailingSlash(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}
