/**
 * Tests for `createOperationScope` (`src/async.ts`): tokens that stay valid until the scope is invalidated (a network or account change),
 * unlike `createGeneration`, where starting a new operation also cancels the old ones.
 */
import { describe, it, expect } from 'vitest'
import { createOperationScope } from '../src/async.js'

describe('createOperationScope', () => {
  it('a token is current until the scope is invalidated', () => {
    const scope = createOperationScope()
    const op = scope.begin()
    expect(op.isCurrent()).toBe(true)
    scope.invalidate()
    expect(op.isCurrent()).toBe(false)
  })

  // Starting an operation must not cancel its siblings, and a token issued after the change belongs to the new state.
  it('invalidates every earlier token but not one issued afterwards', () => {
    const scope = createOperationScope()
    const first = scope.begin()
    const second = scope.begin()
    scope.invalidate()
    const third = scope.begin()
    expect([first.isCurrent(), second.isCurrent(), third.isCurrent()]).toEqual([false, false, true])
  })

  it('stays invalid after a second invalidation (A to B to A is still a different state)', () => {
    const scope = createOperationScope()
    const op = scope.begin()
    scope.invalidate()
    scope.invalidate()
    expect(op.isCurrent()).toBe(false)
  })
})
