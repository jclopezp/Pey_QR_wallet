export const peyErrorCodes = [
  'pey_invalid_request',
  'pey_unauthorized',
  'pey_unavailable',
  'pey_unknown',
] as const;

export type PeyErrorCode = (typeof peyErrorCodes)[number];
