// Exact fixed-point amounts. A chain amount is a bigint count of base units (1 SUI = 10^9 MIST), and an amount of money is an
// integer count of micro-units; neither may go through floating point, which loses precision above 2^53 and rounds ties
// unpredictably. Everything here works on the decimal digits of a bigint.

const pow10 = (n: number): bigint => 10n ** BigInt(n)

/**
 * Parse a non-negative decimal (`"1.5"`, `".5"`, `"12"`) into base units, exactly. Returns `null` for anything else: empty,
 * negative, exponent forms, more than `decimals` fraction digits (silently rounding money is how it goes missing).
 */
export function parseFixed(text: string, decimals: number): bigint | null {
  const m = /^\s*(\d*)(?:\.(\d*))?\s*$/.exec(text)
  if (!m) return null
  const whole = m[1] ?? ''
  const frac = m[2] ?? ''
  if (whole === '' && frac === '') return null
  if (frac.length > decimals) return null
  return BigInt(whole || '0') * pow10(decimals) + BigInt(frac.padEnd(decimals, '0') || '0')
}

export interface FormatFixedOptions {
  /** Keep at least this many fraction digits (default 0: trailing zeros are dropped). */
  minFraction?: number
  /** Round half away from zero to at most this many fraction digits (default: exact, no rounding). */
  maxFraction?: number
  /** Group the whole part in thousands with this locale (for example `en-GB`); default none. */
  group?: string
}

/**
 * Write base units as a decimal string. Exact by default (`1_500_000_000n`, 9 → `1.5`); `maxFraction` rounds half away from
 * zero, and `minFraction` pads, so `formatFixed(5n, 3, { minFraction: 2 })` is `0.005` and `formatFixed(200_000n, 6, { minFraction: 2 })`
 * is `0.20`.
 */
export function formatFixed(value: bigint, decimals: number, options: FormatFixedOptions = {}): string {
  const negative = value < 0n
  let abs = negative ? -value : value
  let places = decimals
  if (options.maxFraction !== undefined && options.maxFraction < decimals) {
    const drop = decimals - options.maxFraction
    const unit = pow10(drop)
    abs = (abs + unit / 2n) / unit
    places = options.maxFraction
  }
  const unit = pow10(places)
  const whole = abs / unit
  let frac = (abs % unit).toString().padStart(places, '0').replace(/0+$/, '')
  const min = options.minFraction ?? 0
  if (frac.length < min) frac = frac.padEnd(min, '0')
  const wholeText = options.group ? whole.toLocaleString(options.group) : whole.toString()
  return `${negative && (whole !== 0n || frac !== '') ? '-' : ''}${wholeText}${frac ? `.${frac}` : ''}`
}
