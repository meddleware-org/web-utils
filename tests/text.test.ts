import { describe, expect, it } from 'vitest'
import { formatBytes } from '../src/index.js'

describe('formatBytes', () => {
  it('shows small counts whole', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })
  it('steps through the binary units with one decimal', () => {
    expect(formatBytes(1024)).toBe('1.0 KiB')
    expect(formatBytes(12.3 * 1024)).toBe('12.3 KiB')
    expect(formatBytes(4 * 1024 * 1024)).toBe('4.0 MiB')
    expect(formatBytes(5 * 1024 ** 3)).toBe('5.0 GiB')
  })
  it('stops at tebibytes', () => {
    expect(formatBytes(2048 * 1024 ** 4)).toBe('2048.0 TiB')
  })
  it('does not invent a size for nonsense', () => {
    expect(formatBytes(-1)).toBe('—')
    expect(formatBytes(Number.NaN)).toBe('—')
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('—')
  })
})
