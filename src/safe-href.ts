/** C0 controls, space and DEL, or a backslash: never part of a link we accept. The URL parser would
 * silently delete tabs and newlines (turning `/<TAB>/host` into `//host`) and read `\` as `/`. */
const UNSAFE_CHARS = /[\u0000-\u0020\u007f\\]/

/**
 * Validate a consumer-supplied URL before binding it to an `href` attribute.
 *
 * Allows `https:` (all hosts) and `http:` on `localhost`/`127.0.0.1` (dev only). Returns the
 * **normalised** `URL.href` (so what is rendered is what was checked), or `undefined` — and Vue then
 * renders no `href` — for:
 *
 * - `javascript:`, `data:` and every other scheme;
 * - credentials in the authority (`https://suivision.xyz@evil.com/…` has host `evil.com` but looks like
 *   `suivision.xyz`);
 * - control characters, spaces or backslashes anywhere in the input.
 */
export function safeHref(url: string | undefined | null): string | undefined {
  if (!url || UNSAFE_CHARS.test(url)) return undefined
  try {
    const u = new URL(url)
    if (u.username || u.password) return undefined
    if (u.protocol === 'https:') return u.href
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return u.href
  } catch {
    // unparseable URL — reject
  }
  return undefined
}

/** A stand-in origin to resolve against, so a path can be checked without a browser location. */
const SITE = 'https://site.invalid'

/**
 * Validate a consumer-supplied **root-relative path** (`/legal/x.html`). Returns the normalised
 * `pathname + search + hash`, or `undefined` if the value is not a single-slash path that stays on the
 * site: `//host`, `/\host`, anything with a control character or space (`/<TAB>/host` would be read as
 * `//host`), or a value that resolves to another origin.
 */
export function safePath(path: string | undefined | null): string | undefined {
  if (!path || UNSAFE_CHARS.test(path) || !path.startsWith('/') || path.startsWith('//')) return undefined
  try {
    const u = new URL(path, SITE)
    if (u.origin !== SITE) return undefined
    return u.pathname + u.search + u.hash
  } catch {
    return undefined
  }
}

/**
 * Validate an icon supplied by something else (a wallet extension registers its own name and icon) before binding it to an `<img src>`.
 * The Wallet Standard defines the icon as a `data:image/(svg+xml|webp|png|gif);base64,…` URI; anything else (a remote URL, a script URL, a
 * non-image data URI) returns `undefined`, so Vue renders no `src`.
 */
export function safeIcon(icon: unknown): string | undefined {
  return typeof icon === 'string' && /^data:image\/(svg\+xml|webp|png|gif);base64,/i.test(icon) ? icon : undefined
}
