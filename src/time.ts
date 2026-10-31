// Time zones and dates for people. Everything is stored and exchanged in UTC; a UI shows and edits wall-clock time in the zone a
// person chose (default: the browser's). `datetime-local` inputs carry a wall time with no zone, so conversion in both
// directions goes through the chosen zone with Intl only (no library). Formatters are built once per zone and cached.

const LOCALE = 'en-GB'
const day = { day: 'numeric', month: 'short', year: 'numeric' } as const

const partsCache = new Map<string, Intl.DateTimeFormat>()
function parts(tz: string): Intl.DateTimeFormat {
  let f = partsCache.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE, {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    partsCache.set(tz, f)
  }
  return f
}

const dateTimeCache = new Map<string, Intl.DateTimeFormat>()
const dateCache = new Map<string, Intl.DateTimeFormat>()
const clockCache = new Map<string, Intl.DateTimeFormat>()
const BROWSER = ''

function cached(cache: Map<string, Intl.DateTimeFormat>, tz: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = tz ?? BROWSER
  let f = cache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE, { ...options, ...(tz ? { timeZone: tz } : {}) })
    cache.set(key, f)
  }
  return f
}

/** Whether the runtime knows this IANA zone. */
export function isZone(tz: string): boolean {
  try {
    parts(tz)
    return true
  } catch {
    return false
  }
}

/** The runtime's own zone (the person's, in a browser), or `UTC` when it cannot say. */
export const browserZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** The zone's offset from UTC at an instant, in minutes (positive east of Greenwich). */
export function offsetMinutes(ms: number, tz: string): number {
  const p = Object.fromEntries(parts(tz).formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
  const asUtc = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!, +p.second!)
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000)
}

/** `YYYY-MM-DDTHH:mm` (a `datetime-local` value) for an instant, as a wall time in the zone. */
export function toLocalInput(iso: string | null | undefined, tz: string): string {
  if (!iso) return ''
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return ''
  const p = Object.fromEntries(parts(tz).formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/**
 * The UTC instant (ISO 8601) of a wall time in a zone, or `null` when the input is empty or invalid. A wall time that does not
 * exist (the hour skipped at a spring-forward) moves forward by the gap; an ambiguous one (the repeated hour in autumn) takes
 * the first occurrence.
 */
export function fromLocalInput(value: string, tz: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim())
  if (!m) return null
  const [y, mo, d, h, mi] = m.slice(1).map(Number) as [number, number, number, number, number]
  const wall = Date.UTC(y, mo - 1, d, h, mi)
  if (Number.isNaN(wall) || new Date(wall).getUTCMonth() !== mo - 1) return null
  const oneDay = 24 * 3600 * 1000
  const before = offsetMinutes(wall - oneDay, tz)
  const after = offsetMinutes(wall + oneDay, tz)
  // Instants whose wall time in the zone is exactly this one: one normally, two in the repeated hour, none in a gap.
  const valid = [...new Set([before, after])].map((o) => wall - o * 60000).filter((t) => wall - t === offsetMinutes(t, tz) * 60000)
  const at = valid.length > 0 ? Math.min(...valid) : wall - before * 60000
  return new Date(at).toISOString()
}

/** The calendar day of an instant in the zone, as `YYYY-MM-DD`. */
export function dayKey(iso: string, tz: string): string {
  return toLocalInput(iso, tz).slice(0, 10)
}

export interface FormatOptions {
  /** IANA zone to show the instant in; default the runtime's own. */
  tz?: string
  /** What to return for a missing or invalid instant; default `—`. */
  empty?: string
}

const resolve = (o: string | FormatOptions | undefined): FormatOptions => (typeof o === 'string' ? { tz: o } : (o ?? {}))

/** A readable date and time, naming the zone (`29 Oct 2026, 14:05 BST`). A string argument is the zone. */
export function formatDateTime(iso: string | null | undefined, options?: string | FormatOptions): string {
  const { tz, empty = '—' } = resolve(options)
  if (!iso) return empty
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return empty
  return cached(dateTimeCache, tz, { ...day, hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }).format(new Date(ms))
}

/** A readable date (`29 Oct 2026`). */
export function formatDate(iso: string | null | undefined, options?: string | FormatOptions): string {
  const { tz, empty = '—' } = resolve(options)
  if (!iso) return empty
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return empty
  return cached(dateCache, tz, day).format(new Date(ms))
}

/** The time of day only, `HH:mm`, in the zone (a calendar cell, a table column). */
export function formatClock(iso: string | null | undefined, options?: string | FormatOptions): string {
  const { tz, empty = '—' } = resolve(options)
  if (!iso) return empty
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return empty
  return cached(clockCache, tz, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms))
}

/** `1 Mar 2027 – 31 May 2027`, or `From …` / `Until …` for one side, or an empty string for neither. */
export function formatWindow(start: string | null | undefined, end: string | null | undefined, options?: string | FormatOptions): string {
  const o = { ...resolve(options), empty: '' }
  const a = formatDate(start, o)
  const b = formatDate(end, o)
  if (a && b) return `${a} – ${b}`
  return a ? `From ${a}` : b ? `Until ${b}` : ''
}
