/**
 * Extract a human-readable message from an unknown thrown value.
 *
 * Wallet SDKs sometimes throw plain objects (e.g. `{ code: 4001, message: "…" }`)
 * rather than Error instances. This handles those alongside real Error objects,
 * nested `cause` fields, and arbitrary fallback via String().
 */
export function errorMessage(e: unknown): string {
  return messageOf(e, 0)
}

/** How many `cause` links are followed: a wallet extension can throw an object whose cause is itself. */
const MAX_CAUSE_DEPTH = 8

function messageOf(e: unknown, depth: number): string {
  if (typeof e === 'string') return e
  if (e instanceof Error) {
    // Some wallet errors wrap the real message in a cause
    if (!e.message && e.cause != null && depth < MAX_CAUSE_DEPTH) return messageOf(e.cause, depth + 1)
    return e.message || e.toString()
  }
  if (typeof e === 'object' && e !== null) {
    const obj = e as Record<string, unknown>
    if (typeof obj.message === 'string' && obj.message) return obj.message
    if (obj.cause != null && depth < MAX_CAUSE_DEPTH) return messageOf(obj.cause, depth + 1)
  }
  return String(e)
}
