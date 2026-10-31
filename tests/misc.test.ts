import { describe, expect, it, vi } from 'vitest'
import { isObj, str } from '../src/guards.js'
import { humanize } from '../src/text.js'
import { safeFileName, triggerDownload } from '../src/download.js'
import { safeStorage } from '../src/storage.js'

describe('guards', () => {
  it('isObj accepts plain objects only', () => {
    expect(isObj({})).toBe(true)
    for (const v of [null, [], 'x', 1, undefined]) expect(isObj(v), String(v)).toBe(false)
  })
  it('str accepts strings within a length', () => {
    expect(str('abc', 3)).toBe('abc')
    expect(str('abcd', 3)).toBeNull()
    expect(str(5, 10)).toBeNull()
  })
})

describe('humanize', () => {
  it('replaces every underscore, not only the first', () => {
    expect(humanize('in_progress')).toBe('in progress')
    expect(humanize('manual_required_now')).toBe('manual required now')
    expect(humanize('plain')).toBe('plain')
  })
})

describe('safeFileName', () => {
  it('keeps word characters, dots and dashes; strips the rest and leading dots', () => {
    expect(safeFileName('my file (1).txt', 'x')).toBe('my_file__1_.txt')
    expect(safeFileName('../../etc/passwd', 'x')).toBe('_.._etc_passwd')
    expect(safeFileName('...hidden', 'x')).toBe('hidden')
    expect(safeFileName(undefined, 'sealed')).toBe('sealed')
    expect(safeFileName('', 'sealed')).toBe('sealed')
    expect(safeFileName('a'.repeat(300), 'x')).toHaveLength(100)
  })
})

describe('triggerDownload', () => {
  it('clicks a download link with the name, then releases the object URL later, not at once', () => {
    vi.useFakeTimers()
    const created = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    const revoked = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const a = { href: '', download: '', click: vi.fn() }
    triggerDownload(new Blob(['x']), 'f.txt', { createElement: () => a } as unknown as Document)
    expect(created).toHaveBeenCalledOnce()
    expect(a).toMatchObject({ href: 'blob:fake', download: 'f.txt' })
    expect(a.click).toHaveBeenCalledOnce()
    expect(revoked).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(revoked).toHaveBeenCalledWith('blob:fake')
    vi.useRealTimers()
    vi.restoreAllMocks()
  })
})

describe('safeStorage', () => {
  it('is null where there is no storage (a server render)', () => {
    vi.stubGlobal('localStorage', undefined)
    vi.stubGlobal('sessionStorage', undefined)
    expect(safeStorage()).toBeNull()
    expect(safeStorage('session')).toBeNull()
    vi.unstubAllGlobals()
  })

  it('returns the storage when present, and null when even reading it throws', () => {
    const fake = { getItem: () => null } as unknown as Storage
    vi.stubGlobal('localStorage', fake)
    expect(safeStorage()).toBe(fake)
    vi.unstubAllGlobals()
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('SecurityError') } })
    try {
      expect(safeStorage()).toBeNull()
    } finally {
      Reflect.deleteProperty(globalThis, 'localStorage')
    }
  })
})
