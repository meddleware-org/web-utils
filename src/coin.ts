// SUI and WAL amounts. Both coins have 9 decimals: 1 SUI = 1_000_000_000 MIST, 1 WAL = 1_000_000_000 FROST.
import { formatFixed, parseFixed } from './fixed.js'

export const COIN_DECIMALS = 9
export const MIST_PER_SUI = 1_000_000_000n

/**
 * A finite number as the plain decimal it stands for: the shortest digits that round-trip (`String(n)`, what a person typed into a
 * `type="number"` field), with an exponent form (`5e-7`, `1e+21`) written out. Never `toFixed`, which rounds digits away.
 */
function plainDecimal(n: number): string {
  const m = /^(\d+)(?:\.(\d+))?e([+-]\d+)$/.exec(String(n))
  if (!m) return String(n)
  const digits = (m[1] ?? '') + (m[2] ?? '')
  const point = (m[1] ?? '').length + Number(m[3])
  if (point <= 0) return `0.${'0'.repeat(-point)}${digits}`
  if (point >= digits.length) return digits + '0'.repeat(point - digits.length)
  return `${digits.slice(0, point)}.${digits.slice(point)}`
}

/**
 * Convert a decimal SUI amount to MIST, exactly. Strings are parsed digit by digit; numbers (Vue's `v-model` casts
 * `type="number"` inputs) are written out as the decimal they stand for (exponent forms such as `5e-7` included) and then parsed the
 * same way, so a number is never rounded. Throws on anything that is not a non-negative amount with at most 9 decimals.
 */
export function suiToMist(sui: string | number): bigint {
  if (typeof sui === 'number') {
    if (!Number.isFinite(sui) || sui < 0) throw new Error('Invalid price.')
    sui = plainDecimal(sui)
  }
  if (/^\s*\d*\.\d{10,}\s*$/.test(sui)) throw new Error('Price has more than 9 decimal places (1 MIST = 0.000000001 SUI).')
  const mist = parseFixed(sui, COIN_DECIMALS)
  if (mist === null) throw new Error('Invalid price.')
  return mist
}

/** MIST as a trimmed decimal SUI string, exactly (`500n` → `0.0000005`). */
export function mistToSui(mist: bigint): string {
  return formatFixed(mist, COIN_DECIMALS)
}

/**
 * A SUI/WAL base-unit amount for display, with its ticker. Four decimals for ordinary amounts, but a tiny non-zero value shows
 * every significant digit instead of rounding to `0.0000` (a real relay tip of 10_000 MIST is `0.00001 SUI`, not zero).
 * Rounding is half away from zero on the exact digits, so it is the same on every machine.
 */
export function formatCoinAmount(base: bigint, symbol: string): string {
  if (base === 0n) return `0 ${symbol}`
  const abs = base < 0n ? -base : base
  // 0.0001 of a coin is 100_000 base units.
  if (abs >= 100_000n) return `${formatFixed(base, COIN_DECIMALS, { maxFraction: 4, minFraction: 4 })} ${symbol}`
  return `${formatFixed(base, COIN_DECIMALS)} ${symbol}`
}

/**
 * A base-unit amount written exactly, no rounding (`10_000_001n` → `0.010000001 SUI`). Used where a person approves a payment,
 * so the figure shown is the figure paid.
 */
export function formatCoinExact(base: bigint, symbol: string): string {
  return `${formatFixed(base, COIN_DECIMALS)} ${symbol}`
}
