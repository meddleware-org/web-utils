// Guards against a slower, older asynchronous result overwriting a newer one, or applying to state that has since changed.

/**
 * A counter where each `begin()` supersedes the one before: the token a call gets is current only until the next call starts.
 * Use it for a load that can be triggered again while an earlier one is still awaiting.
 *
 * ```ts
 * const generation = createGeneration()
 * async function load() {
 *   const current = generation.begin()
 *   const rows = await fetchRows()
 *   if (!current()) return // a newer load started; drop this result
 *   rows.value = rows
 * }
 * ```
 */
export interface Generation {
  /** Start an operation: invalidates every earlier token and returns this operation's `isCurrent`. */
  begin(): () => boolean
  /** Invalidate every token issued so far without starting a new operation (the network or account changed). */
  invalidate(): void
}

export function createGeneration(): Generation {
  let generation = 0
  return {
    begin() {
      const mine = ++generation
      return () => mine === generation
    },
    invalidate() {
      generation++
    },
  }
}

/** A handle to one operation's scope. */
export interface OperationToken {
  /** True until the scope is invalidated after this token was issued. */
  isCurrent(): boolean
}

/** A scope that operations begin in and that a state change invalidates. */
export interface OperationScope {
  /** Issue a token for an operation that is starting now (earlier tokens stay valid). */
  begin(): OperationToken
  /** Invalidate every token issued so far. */
  invalidate(): void
}

/**
 * Binds an operation to the network and account it started on. Wallet state is shared and can change while a request is awaiting
 * (a network switch, an account switch, a disconnect); the view invalidates the scope on each change, and an operation begun earlier
 * finds `isCurrent()` false after its next await and drops its result. Unlike {@link createGeneration}, beginning an operation does
 * not cancel others: only `invalidate()` does. Every `await` in an operation is followed by an `isCurrent()` check.
 */
export function createOperationScope(): OperationScope {
  let generation = 0
  return {
    begin() {
      const issued = generation
      return { isCurrent: () => issued === generation }
    },
    invalidate() {
      generation++
    },
  }
}
