import { describe, expect, it } from 'vitest'
import { formatFixed, parseFixed } from '../src/fixed.js'

describe('parseFixed', () => {
  it('reads decimals exactly', () => {
    expect(parseFixed('1.5', 9)).toBe(1_500_000_000n)
    expect(parseFixed('.5', 9)).toBe(500_000_000n)
    expect(parseFixed('12', 6)).toBe(12_000_000n)
    expect(parseFixed(' 0.000001 ', 6)).toBe(1n)
    expect(parseFixed('18446744073709551615.999999999', 9)).toBe(18446744073709551615999999999n) // beyond 2^53
  })

  it('refuses what is not a non-negative decimal within the precision', () => {
    for (const bad of ['', '.', '-1', '1e3', '1,5', '1.2.3', 'abc', '0.0000001']) expect(parseFixed(bad, 6), bad).toBeNull()
  })
})

describe('formatFixed', () => {
  it('writes exactly by default and trims trailing zeros', () => {
    expect(formatFixed(1_500_000_000n, 9)).toBe('1.5')
    expect(formatFixed(500n, 9)).toBe('0.0000005')
    expect(formatFixed(0n, 9)).toBe('0')
    expect(formatFixed(12_000_000_001n, 9)).toBe('12.000000001')
    expect(formatFixed(18446744073709551615999999999n, 9)).toBe('18446744073709551615.999999999')
  })

  it('pads to a minimum, groups, and handles negatives', () => {
    expect(formatFixed(200_000n, 6, { minFraction: 2 })).toBe('0.20')
    expect(formatFixed(0n, 6, { minFraction: 2 })).toBe('0.00')
    expect(formatFixed(1_234_567_890n, 6, { minFraction: 2, group: 'en-GB' })).toBe('1,234.56789')
    expect(formatFixed(-1_500_000n, 6)).toBe('-1.5')
    expect(formatFixed(-1n, 6, { maxFraction: 2 })).toBe('0') // rounds to nothing, so no minus sign
  })

  it('rounds half away from zero when asked, on the exact digits', () => {
    expect(formatFixed(15_000_000n, 9, { maxFraction: 2 })).toBe('0.02')
    expect(formatFixed(14_999_999n, 9, { maxFraction: 2 })).toBe('0.01')
    expect(formatFixed(-15_000_000n, 9, { maxFraction: 2 })).toBe('-0.02')
    expect(formatFixed(999_950_000n, 9, { maxFraction: 2, minFraction: 2 })).toBe('1.00')
    expect(formatFixed(123_456_789n, 9, { maxFraction: 20 })).toBe('0.123456789') // a cap above the precision changes nothing
  })

  it('round-trips parse then format', () => {
    for (const s of ['0', '1', '0.5', '123.456789', '0.000000001']) expect(formatFixed(parseFixed(s, 9)!, 9)).toBe(s)
  })
})
