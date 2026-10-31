import { describe, it, expect } from 'vitest'
import { errorMessage } from '../src/errors.js'

describe('errorMessage', () => {
  it('returns the message from a standard Error', () => {
    expect(errorMessage(new Error('something went wrong'))).toBe('something went wrong')
  })

  it('returns a plain string unchanged', () => {
    expect(errorMessage('oops')).toBe('oops')
  })

  it('extracts message from a plain object — wallet rejection pattern', () => {
    expect(errorMessage({ code: 4001, message: 'User rejected the request.' }))
      .toBe('User rejected the request.')
  })

  it('falls back to cause when Error.message is empty', () => {
    const e = new Error()
    ;(e as any).cause = new Error('nested cause')
    expect(errorMessage(e)).toBe('nested cause')
  })

  it('extracts cause.message from a plain object with nested cause', () => {
    expect(errorMessage({ cause: { message: 'inner error' } })).toBe('inner error')
  })

  it('falls back to String() for unrecognised values', () => {
    expect(errorMessage(42)).toBe('42')
    expect(errorMessage(null)).toBe('null')
  })
})
