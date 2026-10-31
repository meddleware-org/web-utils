// Bounded network reads. Every request has a timeout, and a response body is read with a size cap before it is parsed, so a slow or
// oversized reply from a third party fails with a clear message instead of stalling the page.

type Fetcher = typeof fetch

/** A non-2xx response. */
export class HttpError extends Error {
  readonly status: number
  constructor(status: number) {
    super(`HTTP ${status}`)
    this.name = 'HttpError'
    this.status = status
  }
}

export interface FetchJsonOptions {
  /** Time allowed for the headers and the body (default 10 s). */
  timeoutMs?: number
  /** The fetch to use (default: the global one, looked up at call time so a test can replace it). */
  fetcher?: Fetcher
  /** Extra request options (headers are merged over `accept: application/json`). */
  init?: RequestInit
  /** Refuse a body larger than this many bytes (default: no cap). */
  maxBytes?: number
}

/**
 * GET a JSON document: `accept: application/json`, no credentials, no cache, a timeout covering headers and body. Rejects with an
 * {@link HttpError} for a non-2xx status, and a clear message for a timeout or invalid JSON.
 */
export async function fetchJson(url: string, options: FetchJsonOptions = {}): Promise<unknown> {
  const { timeoutMs = 10_000, init, maxBytes } = options
  const fetcher: Fetcher = options.fetcher ?? ((...args) => globalThis.fetch(...args))
  const res = await fetchWithTimeout(
    fetcher,
    url,
    { credentials: 'omit', cache: 'no-cache', ...init, headers: { accept: 'application/json', ...(init?.headers as Record<string, string> | undefined) } },
    timeoutMs,
    url,
  )
  if (!res.ok) throw new HttpError(res.status)
  if (maxBytes !== undefined) return readBoundedJson(res, maxBytes, url)
  try {
    return await res.json()
  } catch (e) {
    throw new Error(`${url} is not valid JSON.`, { cause: e })
  }
}

/**
 * `fetcher(url, init)` with a timeout that covers the headers and the body. A timeout or any other network failure rejects with a
 * message naming `label`.
 */
export async function fetchWithTimeout(fetcher: Fetcher, url: string, init: RequestInit, timeoutMs: number, label: string): Promise<Response> {
  try {
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
 */
export async function readBoundedText(res: Response, maxBytes: number, label: string): Promise<string> {
  const tooLarge = (): Error => new Error(`${label} is larger than ${Math.round(maxBytes / 1024)} KiB; refusing to read it.`)
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

/** {@link readBoundedText}, then `JSON.parse`; invalid JSON rejects with a message naming `label`. */
export async function readBoundedJson(res: Response, maxBytes: number, label: string): Promise<unknown> {
  const text = await readBoundedText(res, maxBytes, label)
  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error(`${label} is not valid JSON.`, { cause: e })
  }
}
