import type { PeyClient } from './integrations/pey/client'
import { createPeyClient, type PeyClientEnv } from './integrations/pey/create-client'

export async function start(env: PeyClientEnv, listen: (pey: PeyClient) => Promise<void>): Promise<void> {
  const pey = createPeyClient(env)
  await listen(pey)
}
