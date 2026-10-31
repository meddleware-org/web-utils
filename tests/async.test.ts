import { describe, expect, it } from 'vitest'
import { createGeneration } from '../src/async.js'

describe('createGeneration', () => {
  it('lets only the latest operation apply its result', () => {
    const g = createGeneration()
    const first = g.begin()
    expect(first()).toBe(true)
    const second = g.begin()
    expect(first()).toBe(false) // superseded by a newer load
    expect(second()).toBe(true)
  })

  it('invalidates everything issued so far without starting an operation', () => {
    const g = createGeneration()
    const a = g.begin()
    g.invalidate()
    expect(a()).toBe(false)
    expect(g.begin()()).toBe(true)
  })

  it('drops a slow earlier result in a realistic race', async () => {
    const g = createGeneration()
    const applied: string[] = []
    const load = async (label: string, ms: number) => {
      const current = g.begin()
      await new Promise((r) => setTimeout(r, ms))
      if (current()) applied.push(label)
    }
    await Promise.all([load('slow-old', 20), load('fast-new', 1)])
    expect(applied).toEqual(['fast-new'])
  })
})
