// Bounded network reads. Every request has a timeout, and a response body is read with a size cap before it is parsed, so a slow or
// oversized reply from a third party fails with a clear message instead of stalling the page.

/** The shape of `fetch`, so a test can pass a stand-in. */
type Fetcher = typeof fetch

/** The body size {@link fetchJson} accepts unless told otherwise: 1 MiB, hundreds of times what any JSON document it reads needs. */
export const DEFAULT_MAX_JSON_BYTES = 1024 * 1024

/** A non-2xx response. */
export class HttpError extends Error {
  /** The HTTP status code the server answered with. */
  readonly status: number
  /** @param status - the response's status code */
  constructor(status: number) {
    super(`HTTP ${status}`)
    this.name = 'HttpError'
    this.status = status
  }
}

/** Options for {@link fetchJson}. */
export interface FetchJsonOptions {
  /** Time allowed for the headers and the body (default 10 s). */
  timeoutMs?: number
  /** The fetch to use (default: the global one, looked up at call time so a test can replace it). */
  fetcher?: Fetcher
  /** Extra request options (headers are merged over `accept: application/json`). */
  init?: RequestInit
  /** Refuse a body larger than this many bytes (default {@link DEFAULT_MAX_JSON_BYTES}; `Infinity` lifts the cap). */
  maxBytes?: number
}

/**
 * GET a JSON document: `accept: application/json`, no credentials, no cache, a timeout covering headers and body, and a size cap on the
 * body ({@link DEFAULT_MAX_JSON_BYTES} by default). Rejects with an {@link HttpError} for a non-2xx status, and a clear message for a
 * timeout, an oversized body or invalid JSON.
 * @param url - the address to read (the message of every failure names it)
 * @param options - the timeout, fetch, extra request options and size cap
 * @returns the parsed JSON, as `unknown`: the caller validates its shape
 */
export async function fetchJson(url: string, options: FetchJsonOptions = {}): Promise<unknown> {
  const { timeoutMs = 10_000, init, maxBytes = DEFAULT_MAX_JSON_BYTES } = options
  // Looked up when the call is made, not at import, so a test (or a polyfill) that replaces `globalThis.fetch` later is honoured.
  const fetcher: Fetcher = options.fetcher ?? ((...args) => globalThis.fetch(...args))
  const res = await fetchWithTimeout(
    fetcher,
    url,
    // No credentials and no cache: a third party's JSON is read as an anonymous, fresh request (no cookie is ever sent).
    { credentials: 'omit', cache: 'no-cache', ...init, headers: { accept: 'application/json', ...(init?.headers as Record<string, string> | undefined) } },
    timeoutMs,
    url,
  )
  if (!res.ok) throw new HttpError(res.status)
  return readBoundedJson(res, maxBytes, url)
}

/**
 * `fetcher(url, init)` with a timeout that covers the headers and the body. A timeout or any other network failure rejects with a
 * message naming `label`.
 * @param fetcher - the fetch to use
 * @param url - the address
 * @param init - request options (a `signal` is added; any of its own is replaced)
 * @param timeoutMs - the time allowed, in milliseconds
 * @param label - what to call the request in the error message
 * @returns the response, with its body still unread
 */
export async function fetchWithTimeout(fetcher: Fetcher, url: string, init: RequestInit, timeoutMs: number, label: string): Promise<Response> {
  try {
    // AbortSignal.timeout keeps the deadline running while the body is read, so a server that sends headers and then stalls still times out.
    return await fetcher(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError')) {
      throw new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s.`, { cause: e })
    }
    throw e
  }
}

/**
 * Read a response body as UTF-8 text, refusing more than `maxBytes`. A declared `Content-Length` over the cap fails before any byte
 * is read; a body that grows past it is cancelled.
 * @param res - the response
 * @param maxBytes - the most bytes to accept
 * @param label - what to call the body in the error message
 * @returns the body decoded as UTF-8 (an empty string when there is no body)
 */
export async function readBoundedText(res: Response, maxBytes: number, label: string): Promise<string> {
  const tooLarge = (): Error => new Error(`${label} is larger than ${Math.round(maxBytes / 1024)} KiB; refusing to read it.`)
  // The declared length is checked first so an honest oversized body is refused without reading a byte; a missing header gives 0 and passes.
  const declared = Number(res.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    await res.body?.cancel().catch(() => undefined)
    throw tooLarge()
  }
  if (!res.body) return ''
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    // The declared length can lie or be absent (chunked), so the bytes actually read are counted too.
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined)
        throw tooLarge()
      }
      chunks.push(value)
    }
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError')) {
      throw new Error(`${label} timed out while reading.`, { cause: e })
    }
    throw e
  }
  const bytes = new Uint8Array(total)
  let at = 0
  for (const c of chunks) {
    bytes.set(c, at)
    at += c.byteLength
  }
  return new TextDecoder().decode(bytes)
}

/**
 * {@link readBoundedText}, then `JSON.parse`; invalid JSON rejects with a message naming `label`.
 * @param res - the response
 * @param maxBytes - the most bytes to accept
 * @param label - what to call the body in the error messages
 * @returns the parsed JSON, as `unknown`
 */
export async function readBoundedJson(res: Response, maxBytes: number, label: string): Promise<unknown> {
  const text = await readBoundedText(res, maxBytes, label)
  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error(`${label} is not valid JSON.`, { cause: e })
  }
}
