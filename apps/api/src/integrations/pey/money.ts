export function amountCentsToPey(amountCents: number): number {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new RangeError('amountCents must be a non-negative integer')
  }
  const pesos = Math.trunc(amountCents / 100)
  const remainder = amountCents % 100
  if (remainder === 0) {
    return pesos
  }
  return Number(`${pesos}.${String(remainder).padStart(2, '0')}`)
}
