import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPeyClient } from './create-client'
import { start } from '../../server'

const qrInput = {
  amountCents: 0,
  bankAccountId: '01JBAVWE4NS5TGXHWGMX3KH23Q',
  metadata: { qrId: 'qr_1', businessId: 'biz_1' },
}

describe('createPeyClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('refuses live mode when the API key is missing', () => {
    expect(() =>
      createPeyClient({ PEY_MODE: 'live', PEY_BASE_URL: 'https://api.pey.mx' }),
    ).toThrow('PEY_API_KEY is required when PEY_MODE is live')
  })

  it('uses the mock client without calling fetch', async () => {
    vi.stubGlobal('fetch', () => {
      throw new Error('network')
    })
    const client = createPeyClient({ PEY_MODE: 'mock', PEY_BASE_URL: 'https://api.pey.mx' })
    await expect(client.createQr(qrInput)).resolves.toEqual({
      peyQrId: 'mock_qr_1',
      qrString: '{"TYP":1,"mock":true}',
    })
  })

  it('does not listen when live mode has no key', async () => {
    let listened = false
    await expect(
      start({ PEY_MODE: 'live', PEY_BASE_URL: 'https://api.pey.mx' }, async () => {
        listened = true
      }),
    ).rejects.toThrow('PEY_API_KEY is required when PEY_MODE is live')
    expect(listened).toBe(false)
  })
})
