import { describe, expect, it } from 'vitest'
import { PeyError } from './errors'
import { HttpPeyClient } from './http-client'

const baseUrl = 'https://api.pey.mx'
const bankAccountId = '01JBAVWE4NS5TGXHWGMX3KH23Q'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('HttpPeyClient.createQr', () => {
  it('posts a generic QR with amount 0 and metadata', async () => {
    const calls: Array<{ url: string; method: string; headers: Headers; body: unknown }> = []
    const fetchImpl: typeof fetch = async (input, init) => {
      calls.push({
        url: String(input),
        method: init?.method ?? 'GET',
        headers: new Headers(init?.headers),
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      })
      return jsonResponse(201, { id: 'AB12CD34EF', qrString: '{"TYP":1}' })
    }

    const client = new HttpPeyClient({ baseUrl, apiKey: 'test-key', fetchImpl })
    const result = await client.createQr({
      amountCents: 0,
      bankAccountId,
      metadata: { qrId: 'qr_1', businessId: 'biz_1' },
    })

    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe(`${baseUrl}/codi/qr`)
    expect(calls[0]?.method).toBe('POST')
    expect(calls[0]?.headers.get('authorization')).toBe('Bearer test-key')
    expect(calls[0]?.headers.get('content-type')).toBe('application/json')
    expect(calls[0]?.body).toEqual({
      amount: 0,
      bankAccountId,
      metadata: { qrId: 'qr_1', businessId: 'biz_1' },
    })
    expect(calls[0]?.body).not.toHaveProperty('concept')
    expect(calls[0]?.body).not.toHaveProperty('expiration')
    expect(calls[0]?.body).not.toHaveProperty('generateImage')
    expect(calls[0]?.body).not.toHaveProperty('numRef')
    expect(result).toEqual({ peyQrId: 'AB12CD34EF', qrString: '{"TYP":1}' })
  })

  it('sends pesos and concept when both are present', async () => {
    let body: { amount: number; concept?: string } | undefined
    const fetchImpl: typeof fetch = async (_input, init) => {
      body = JSON.parse(String(init?.body))
      return jsonResponse(201, { id: 'AB12CD34EF', qrString: '{"TYP":1}', qrImage: null })
    }

    const client = new HttpPeyClient({ baseUrl, apiKey: 'test-key', fetchImpl })
    await client.createQr({
      amountCents: 15050,
      concept: 'Taco',
      bankAccountId,
      metadata: { qrId: 'qr_1', businessId: 'biz_1' },
    })

    expect(JSON.stringify(body?.amount)).toBe('150.5')
    expect(body?.concept).toBe('Taco')
  })

  it('maps a 401 that echoes the key to pey_unauthorized', async () => {
    const fetchImpl: typeof fetch = async () =>
      jsonResponse(401, { error: { message: 'bad Bearer test-key', type: 'test-key' } })
    const client = new HttpPeyClient({ baseUrl, apiKey: 'test-key', fetchImpl })
    const error = await client
      .createQr({
        amountCents: 0,
        bankAccountId,
        metadata: { qrId: 'qr_1', businessId: 'biz_1' },
      })
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(PeyError)
    const peyError = error as PeyError
    expect(peyError.code).toBe('pey_unauthorized')
    expect(peyError.message).toBe('pey_unauthorized')
    expect(peyError.message).not.toContain('test-key')
    expect(peyError.peyType ?? '').not.toContain('test-key')
  })

  it('keeps a short Pey error type on invalid requests', async () => {
    const fetchImpl: typeof fetch = async () =>
      jsonResponse(400, { error: { type: 'INVALID_AMOUNT', message: 'nope' } })
    const client = new HttpPeyClient({ baseUrl, apiKey: 'test-key', fetchImpl })
    await expect(
      client.createQr({
        amountCents: 0,
        bankAccountId,
        metadata: { qrId: 'qr_1', businessId: 'biz_1' },
      }),
    ).rejects.toMatchObject({ code: 'pey_invalid_request', peyType: 'INVALID_AMOUNT' })
  })

  it('raises pey_unknown when a success body has the wrong shape', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse(200, { unexpected: true })
    const client = new HttpPeyClient({ baseUrl, apiKey: 'test-key', fetchImpl })
    await expect(
      client.createQr({
        amountCents: 0,
        bankAccountId,
        metadata: { qrId: 'qr_1', businessId: 'biz_1' },
      }),
    ).rejects.toMatchObject({ code: 'pey_unknown' })
  })

  it('sends one request and fails when Pey does not answer', async () => {
    let calls = 0
    const fetchImpl: typeof fetch = () => {
      calls += 1
      return new Promise<Response>(() => {})
    }
    const client = new HttpPeyClient({ baseUrl, apiKey: 'test-key', fetchImpl, timeoutMs: 20 })
    const started = Date.now()
    await expect(
      client.createQr({
        amountCents: 0,
        bankAccountId,
        metadata: { qrId: 'qr_1', businessId: 'biz_1' },
      }),
    ).rejects.toMatchObject({ code: 'pey_unavailable' })
    expect(calls).toBe(1)
    expect(Date.now() - started).toBeLessThan(1000)
  })
})
