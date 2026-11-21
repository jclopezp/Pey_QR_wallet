const WEIGHTS = [3, 7, 1] as const;

export function isValidClabe(clabe: string): boolean {
  if (!/^\d{18}$/.test(clabe)) {
    return false;
  }
  let sum = 0;
  for (let index = 0; index < 17; index += 1) {
    const weight = WEIGHTS[index % 3] ?? 0;
    sum += Number(clabe.charAt(index)) * weight;
  }
  const check = (10 - (sum % 10)) % 10;
  return Number(clabe[17]) === check;
}
