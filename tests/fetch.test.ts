import { describe, expect, it, vi } from 'vitest'
import { HttpError, fetchJson, fetchWithTimeout, readBoundedJson, readBoundedText } from '../src/fetch.js'

const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, ...init })

describe('fetchJson', () => {
  it('asks for JSON without credentials or cache, and returns the parsed body', async () => {
    const fetcher = vi.fn(async () => json({ ok: 1 }))
    expect(await fetchJson('https://x.test/a', { fetcher: fetcher as unknown as typeof fetch })).toEqual({ ok: 1 })
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://x.test/a')
    expect(init.credentials).toBe('omit')
    expect(init.cache).toBe('no-cache')
    expect((init.headers as Record<string, string>).accept).toBe('application/json')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('merges extra headers over the default and passes other init through', async () => {
    const fetcher = vi.fn(async () => json({}))
    await fetchJson('/x', { fetcher: fetcher as unknown as typeof fetch, init: { headers: { 'x-a': '1' }, method: 'GET' } })
    const init = (fetcher.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect(init.headers).toEqual({ accept: 'application/json', 'x-a': '1' })
  })

  it('rejects a non-2xx response with the status', async () => {
    const fetcher = (async () => new Response('down', { status: 503 })) as typeof fetch
    const e = await fetchJson('/x', { fetcher }).catch((err: unknown) => err)
    expect(e).toBeInstanceOf(HttpError)
    expect((e as HttpError).status).toBe(503)
    expect((e as HttpError).message).toBe('HTTP 503')
  })

  it('names the URL when the body is not JSON', async () => {
    const fetcher = (async () => new Response('<html>', { status: 200 })) as typeof fetch
    await expect(fetchJson('/x', { fetcher })).rejects.toThrow('/x is not valid JSON.')
  })

  it('times out with a message naming the request', async () => {
    const fetcher = ((_u: string, init: RequestInit) =>
      new Promise((_r, reject) => {
        init.signal!.addEventListener('abort', () => reject(init.signal!.reason))
      })) as unknown as typeof fetch
    await expect(fetchJson('/slow', { fetcher, timeoutMs: 20 })).rejects.toThrow('/slow timed out after 0s.')
  })

  it('uses the global fetch looked up at call time, so a test can replace it', async () => {
    const saved = globalThis.fetch
    globalThis.fetch = (async () => json({ replaced: true })) as typeof fetch
    try {
      expect(await fetchJson('/x')).toEqual({ replaced: true })
    } finally {
      globalThis.fetch = saved
    }
  })

  it('can refuse a body above a cap', async () => {
    const fetcher = (async () => json({ pad: 'x'.repeat(5000) })) as typeof fetch
    await expect(fetchJson('/big', { fetcher, maxBytes: 1024 })).rejects.toThrow(/larger than 1 KiB/)
    expect(await fetchJson('/big', { fetcher, maxBytes: 1024 * 1024 })).toMatchObject({ pad: expect.any(String) })
  })
})

describe('fetchWithTimeout', () => {
  it('passes other failures through untouched', async () => {
    const boom = new Error('network down')
    await expect(fetchWithTimeout((async () => Promise.reject(boom)) as typeof fetch, '/x', {}, 1000, 'thing')).rejects.toBe(boom)
  })
})

describe('bounded reads', () => {
  it('refuses a declared length over the cap before reading', async () => {
    const res = new Response('x', { headers: { 'content-length': '5000' } })
    await expect(readBoundedText(res, 1024, 'the list')).rejects.toThrow('the list is larger than 1 KiB; refusing to read it.')
  })

  it('cancels a body that grows past the cap', async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull(c) {
        c.enqueue(new Uint8Array(600))
      },
    })
    await expect(readBoundedText(new Response(stream), 1024, 'the list')).rejects.toThrow(/larger than 1 KiB/)
  })

  it('reads text and JSON within the cap, and reports invalid JSON by name', async () => {
    expect(await readBoundedText(new Response('héllo'), 1024, 'x')).toBe('héllo')
    expect(await readBoundedJson(new Response('{"a":1}'), 1024, 'x')).toEqual({ a: 1 })
    await expect(readBoundedJson(new Response('nope'), 1024, 'the thing')).rejects.toThrow('the thing is not valid JSON.')
    expect(await readBoundedText(new Response(null), 1024, 'x')).toBe('')
  })
})
