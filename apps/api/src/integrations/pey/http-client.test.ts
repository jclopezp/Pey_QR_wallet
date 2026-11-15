import { describe, expect, it } from 'vitest'
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
})
