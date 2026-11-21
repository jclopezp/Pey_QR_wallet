import type { PeyClient } from './client';
import { createPeyClient, type PeyClientEnv } from './create-client';

/** Creates the Pey client, then runs the listener. A missing live key throws first. */
export async function start(
  env: PeyClientEnv,
  listen: (pey: PeyClient) => Promise<void>,
): Promise<void> {
  const pey = createPeyClient(env);
  await listen(pey);
}
