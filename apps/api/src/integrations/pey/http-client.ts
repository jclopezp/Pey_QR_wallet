import { ZodError, z } from 'zod';
import type { PeyErrorCode } from '@buzzqr/shared';
import { amountCentsToPey } from './money';
import { PeyError } from './errors';
import {
  bankAccountResponseSchema,
  createBankAccountResponseSchema,
  createQrResponseSchema,
} from './schemas';
import type {
  BankAccountResult,
  CreateBankAccountInput,
  CreateBankAccountResult,
  CreateQrInput,
  CreateQrResult,
  PeyClient,
} from './client';

type PeyLogger = { info: (obj: Record<string, unknown>) => void };

export type HttpPeyClientOptions = {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  logger?: PeyLogger;
};

export class HttpPeyClient implements PeyClient {
  constructor(private readonly options: HttpPeyClientOptions) {}

  async createQr(input: CreateQrInput): Promise<CreateQrResult> {
    const body: Record<string, unknown> = {
      amount: amountCentsToPey(input.amountCents),
      bankAccountId: input.bankAccountId,
      metadata: input.metadata,
    };
    if (input.concept !== undefined) {
      body.concept = input.concept;
    }
    const json = await this.request('POST', '/codi/qr', body);
    const parsed = this.parse(createQrResponseSchema, json);
    return { peyQrId: parsed.id, qrString: parsed.qrString };
  }

  async createBankAccount(input: CreateBankAccountInput): Promise<CreateBankAccountResult> {
    const json = await this.request('POST', '/bank-account', {
      alias: input.alias,
      name: input.name,
      clabe: input.clabe,
      entity: input.entity,
    });
    return this.parse(createBankAccountResponseSchema, json);
  }

  async getBankAccount(id: string): Promise<BankAccountResult> {
    const json = await this.request('GET', `/bank-account/${encodeURIComponent(id)}`);
    return this.parse(bankAccountResponseSchema, json);
  }

  private parse<T>(schema: z.ZodType<T>, json: unknown): T {
    try {
      return schema.parse(json);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new PeyError('pey_unknown');
      }
      throw error;
    }
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = new URL(path.replace(/^\//, ''), ensureTrailingSlash(this.options.baseUrl));
    const started = Date.now();
    const timeoutMs = this.options.timeoutMs ?? 10_000;
    let status = 0;
    try {
      const response = await this.send(url, method, body, timeoutMs);
      status = response.status;
      const text = await response.text();
      const json = parseJson(text);
      this.log(method, url.pathname, status, Date.now() - started);
      if (status === 401 || status === 403) {
        throw this.toPeyError(json, 'pey_unauthorized');
      }
      if (status === 400) {
        throw this.toPeyError(json, 'pey_invalid_request');
      }
      if (status === 408 || status === 503) {
        throw this.toPeyError(json, 'pey_unavailable');
      }
      if (status < 200 || status >= 300) {
        throw this.toPeyError(json, 'pey_unknown');
      }
      return json;
    } catch (error) {
      if (error instanceof PeyError) {
        throw error;
      }
      this.log(method, url.pathname, status, Date.now() - started);
      throw new PeyError('pey_unavailable');
    }
  }

  private send(url: URL, method: string, body: unknown, timeoutMs: number): Promise<Response> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const signal = AbortSignal.timeout(timeoutMs);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new DOMException('Timeout', 'TimeoutError'));
      }, timeoutMs);
    });
    const attempt = fetchImpl(url, {
      method,
      headers: {
        authorization: `Bearer ${this.options.apiKey}`,
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
    void attempt.catch(() => undefined);
    return Promise.race([attempt, timeout]).finally(() => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    });
  }

  private toPeyError(json: unknown, code: PeyErrorCode): PeyError {
    const parsed = peyErrorEnvelope.safeParse(json);
    const type = parsed.success ? parsed.data.error.type : undefined;
    return new PeyError(code, safePeyType(type, this.options.apiKey));
  }

  private log(method: string, path: string, status: number, durationMs: number): void {
    this.options.logger?.info({ method, path, status, durationMs });
  }
}

const peyErrorEnvelope = z.object({
  error: z.object({ type: z.string().optional() }),
});

function ensureTrailingSlash(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function safePeyType(type: string | undefined, apiKey: string): string | undefined {
  if (type === undefined || !/^[A-Z0-9_]{1,64}$/.test(type)) {
    return undefined;
  }
  if (apiKey.trim() && type.toLowerCase().includes(apiKey.trim().toLowerCase())) {
    return undefined;
  }
  if (/\d{18}/.test(type)) {
    return undefined;
  }
  return type;
}

function parseJson(text: string): unknown {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
