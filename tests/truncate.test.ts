import { describe, it, expect } from 'vitest'
import { truncateMiddle, DEFAULT_TRUNCATE_CHARS } from '../src/truncate.js'

const ADDRESS = `0x${'ab'.repeat(31)}cd` // 66 characters

describe('truncateMiddle', () => {
  it('shows 10 hex characters on each side of a 32-byte id by default', () => {
    expect(DEFAULT_TRUNCATE_CHARS).toEqual([12, 10])
    expect(truncateMiddle(ADDRESS)).toBe(`${ADDRESS.slice(0, 12)}…${ADDRESS.slice(-10)}`)
    expect(truncateMiddle(ADDRESS)).toHaveLength(12 + 1 + 10)
  })

  it('honours explicit counts', () => {
    expect(truncateMiddle('0123456789', [2, 3])).toBe('01…789')
  })

  it('returns a value that fits whole, instead of duplicating it', () => {
    expect(truncateMiddle('0x1')).toBe('0x1')
    expect(truncateMiddle('0123456789', [6, 4])).toBe('0123456789')
    expect(truncateMiddle('0123456789', [5, 5])).toBe('0123456789')
    expect(truncateMiddle('')).toBe('')
  })

  it('drops a side whose count is zero (slice(-0) would return the whole value)', () => {
    expect(truncateMiddle('0123456789', [4, 0])).toBe('0123…')
    expect(truncateMiddle('0123456789', [0, 4])).toBe('…6789')
    expect(truncateMiddle('0123456789', [0, 0])).toBe('…')
  })

  it('clamps negative, fractional and non-finite counts', () => {
    expect(truncateMiddle('0123456789', [-2, 3])).toBe('…789')
    expect(truncateMiddle('0123456789', [2.9, 3.9])).toBe('01…789')
    expect(truncateMiddle('0123456789', [Number.NaN, 3])).toBe('…789')
  })
})
