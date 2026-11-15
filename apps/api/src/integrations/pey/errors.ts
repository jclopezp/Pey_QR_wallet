import type { PeyErrorCode } from '@peyqr/shared'

export class PeyError extends Error {
  readonly code: PeyErrorCode
  readonly peyType?: string

  constructor(code: PeyErrorCode, peyType?: string) {
    super(code)
    this.name = 'PeyError'
    this.code = code
    if (peyType !== undefined) {
      this.peyType = peyType
    }
  }
}
