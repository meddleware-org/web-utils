// Spend is stored in micro-US-dollars (1 USD = 1 000 000). Conversion is done on the decimal string, never through floating
// point, so $0.015 is exactly 15 000.
import { formatFixed } from './fixed.js'

/**
 * `15000` → `$0.015`; trailing zeros are dropped but at least two decimals are kept. A value that is not a finite number (a field a
 * server left out, an older audit record) is shown as `—`, like the other display helpers, instead of throwing in the middle of a render.
 * @param micros - an amount in millionths of a dollar
 * @returns the amount as `$x.xx…`, or `—`
 */
export function formatUsd(micros: number): string {
  if (typeof micros !== 'number' || !Number.isFinite(micros)) return '—'
  const sign = micros < 0 ? '-' : ''
  return `${sign}$${formatFixed(BigInt(Math.abs(Math.trunc(micros))), 6, { minFraction: 2, group: 'en-GB' })}`
}

/**
 * `"0.015"` → `15000`; `null` when the text is not a non-negative amount with at most six decimals.
 * @param text - the amount as typed, with or without a leading `$`
 * @returns the amount in millionths of a dollar, or `null`
 */
export function parseUsd(text: string): number | null {
  // At most nine whole digits: 999 999 999 dollars is 10^15 micro-dollars, still below 2^53, so the Number arithmetic below stays exact.
  const m = /^\s*\$?(\d{1,9})(?:\.(\d{1,6}))?\s*$/.exec(text)
  if (!m) return null
  const micros = Number(m[1]) * 1_000_000 + Number((m[2] ?? '').padEnd(6, '0'))
  return Number.isSafeInteger(micros) ? micros : null
}
