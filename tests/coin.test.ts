import { describe, expect, it } from 'vitest'
import { formatCoinAmount, formatCoinExact, mistToSui, suiToMist } from '../src/coin.js'

describe('suiToMist / mistToSui', () => {
  it('parses decimal strings exactly', () => {
    expect(suiToMist('0')).toBe(0n)
    expect(suiToMist('1')).toBe(1_000_000_000n)
    expect(suiToMist('0.0000005')).toBe(500n)
    expect(suiToMist('.5')).toBe(500_000_000n)
    expect(suiToMist('12.000000001')).toBe(12_000_000_001n)
  })

  it('accepts numbers from a type="number" v-model, including exponent-sized values', () => {
    expect(suiToMist(0.0000005)).toBe(500n) // String(0.0000005) === '5e-7'
    expect(suiToMist(2.5)).toBe(2_500_000_000n)
    expect(suiToMist(1e-9)).toBe(1n)
    expect(suiToMist(1e21)).toBe(1_000_000_000_000_000_000_000_000_000_000n)
    expect(suiToMist(123.456)).toBe(123_456_000_000n)
  })

  it('rejects a number with more than 9 decimals instead of rounding it (5e-10 was 1 MIST through toFixed)', () => {
    expect(() => suiToMist(5e-10)).toThrow(/more than 9 decimal places/)
    expect(() => suiToMist(1.0000000006)).toThrow(/more than 9 decimal places/)
    expect(() => suiToMist(0.1 + 0.2)).toThrow(/more than 9 decimal places/)
  })

  it('rejects invalid, negative and sub-MIST input', () => {
    for (const bad of ['', 'abc', '-1', '1.2.3', '0.0000000001']) expect(() => suiToMist(bad)).toThrow()
    expect(() => suiToMist(-1)).toThrow()
    expect(() => suiToMist(Number.NaN)).toThrow()
    expect(() => suiToMist('0.0000000001')).toThrow(/more than 9 decimal places/)
    expect(() => suiToMist('abc')).toThrow(/Invalid price/)
  })

  it('formats MIST as trimmed SUI', () => {
    expect(mistToSui(500n)).toBe('0.0000005')
    expect(mistToSui(1_500_000_000n)).toBe('1.5')
    expect(mistToSui(0n)).toBe('0')
  })
})

describe('formatCoinAmount', () => {
  it('shows 4 decimals for normal amounts', () => {
    expect(formatCoinAmount(13_100_000n, 'WAL')).toBe('0.0131 WAL')
    expect(formatCoinAmount(10_000_000n, 'SUI')).toBe('0.0100 SUI')
    expect(formatCoinAmount(1_000_000_000_000n, 'SUI')).toBe('1000.0000 SUI')
  })

  it('shows a tiny nonzero amount truthfully instead of rounding to 0.0000', () => {
    // 10_000 MIST = 0.00001 SUI — the real relay tip base that was displaying as "0.0000".
    expect(formatCoinAmount(10_000n, 'SUI')).toBe('0.00001 SUI')
    expect(formatCoinAmount(99_999n, 'SUI')).toBe('0.000099999 SUI')
    expect(formatCoinAmount(100_000n, 'SUI')).toBe('0.0001 SUI')
  })

  it('renders exact zero plainly', () => {
    expect(formatCoinAmount(0n, 'SUI')).toBe('0 SUI')
  })

  it('stays exact beyond 2^53 base units, where a float would drift', () => {
    expect(formatCoinAmount(9_007_199_254_740_993_000n, 'SUI')).toBe('9007199254.7410 SUI') // 2^53 + 1 SUI-ish, no float rounding
    expect(formatCoinExact(9_007_199_254_740_993_001n, 'SUI')).toBe('9007199254.740993001 SUI')
  })
})

describe('formatCoinExact', () => {
  it('writes the figure that is paid, with no rounding', () => {
    expect(formatCoinExact(10_000_001n, 'SUI')).toBe('0.010000001 SUI')
    expect(formatCoinExact(1_000_000_000n, 'WAL')).toBe('1 WAL')
    expect(formatCoinExact(0n, 'SUI')).toBe('0 SUI')
  })
})
