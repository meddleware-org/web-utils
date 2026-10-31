/**
 * `localStorage` (or `sessionStorage`), or `null` when it is unavailable: a private window, blocked site data, a sandboxed frame,
 * or a server render. Even reading the property can throw, so this never does. Anything found in storage is untrusted (another
 * tab, an older version, tampering): validate its shape.
 */
export function safeStorage(kind: 'local' | 'session' = 'local'): Storage | null {
  try {
    const s = kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage
    return s ?? null
  } catch {
    return null
  }
}
