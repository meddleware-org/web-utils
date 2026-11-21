/**
 * Tests for the micro-dollar helpers (`src/usd.ts`): formatting and parsing without floating point, and a dash for a value that is not a
 * number (a field a server left out) instead of an exception in the middle of a render.
 */
import { describe, expect, it } from 'vitest'
import { formatUsd, parseUsd } from '../src/usd.js'

describe('money', () => {
  it('formats and parses without floating point', () => {
    expect(formatUsd(15_000)).toBe('$0.015')
    expect(formatUsd(200_000)).toBe('$0.20')
    expect(formatUsd(0)).toBe('$0.00')
    expect(formatUsd(1_234_567_890)).toBe('$1,234.56789')
    expect(formatUsd(-15_000)).toBe('-$0.015')
    expect(parseUsd('0.015')).toBe(15_000)
    expect(parseUsd('$2')).toBe(2_000_000)
    expect(parseUsd(' 0.1 ')).toBe(100_000)
    for (const bad of ['', '-1', '1.2345678', 'abc', '1,000', '1e3', '99999999999']) expect(parseUsd(bad), bad).toBeNull()
    for (const n of [0, 1, 15_000, 999_999, 7_654_321]) expect(parseUsd(formatUsd(n).replace(/[$,]/g, ''))).toBe(n)
  })
})

// Older audit records and partial responses reach the display with a missing amount; the helper shows a dash, like the other formatters.
describe('formatUsd with a value that is not a number', () => {
  it('shows a dash instead of throwing', () => {
    for (const bad of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY, '15000'] as unknown[]) expect(formatUsd(bad as number)).toBe('—')
  })
})

