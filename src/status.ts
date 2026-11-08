/** Health state values returned by platform-probe's `/api/status` endpoint. */
export type StatusLevel = 'operational' | 'degraded' | 'down' | 'unknown'

/** A single monitored component within a group. */
export interface StatusComponent {
  name: string
  status: StatusLevel
}

/** A logical capability group containing one or more components. */
export interface StatusGroup {
  name: string
  status: StatusLevel
  components: StatusComponent[]
}

/** The full snapshot returned by `GET /api/status`. */
export interface StatusSnapshot {
  generated_at: string
  overall: StatusLevel
  groups: StatusGroup[]
}

const STATUS_LEVELS = new Set<string>(['operational', 'degraded', 'down', 'unknown'])

/** Type guard for `StatusLevel`. Validates that a raw value is one of the known status strings. */
export function isStatusLevel(s: unknown): s is StatusLevel {
  return typeof s === 'string' && STATUS_LEVELS.has(s)
}

/** Coerce an unknown status value to a valid `StatusLevel` (defaults to `'unknown'`). */
function coerceStatusLevel(s: unknown): StatusLevel {
  return isStatusLevel(s) ? s : 'unknown'
}

/**
 * Strip angle brackets from a name field (defense-in-depth: a name can never carry markup). An ampersand or a quote is legitimate in a name
 * ("Identity & Access") and harmless: every renderer here shows a name as text.
 */
function sanitizeName(s: unknown): string {
  if (typeof s !== 'string' || s.trim() === '') return ''
  return s.replace(/[<>]/g, '')
}

function parseComponent(raw: unknown): StatusComponent | null {
  if (raw === null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const name = sanitizeName(r.name)
  if (!name) return null
  return { name, status: coerceStatusLevel(r.status) }
}

function parseGroup(raw: unknown): StatusGroup | null {
  if (raw === null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const name = sanitizeName(r.name)
  if (!name) return null
  const components = Array.isArray(r.components)
    ? r.components.map(parseComponent).filter((c): c is StatusComponent => c !== null)
    : []
  return { name, status: coerceStatusLevel(r.status), components }
}

/**
 * Parse and validate a raw API response as a `StatusSnapshot`.
 * Returns `null` if the required top-level fields are absent or have unexpected types.
 * Per-group and per-component fields are sanitized: unknown status values are coerced to
 * `'unknown'`; name fields are stripped of HTML-sensitive characters. Groups or components
 * with empty/missing names are dropped.
 */
export function parseSnapshot(raw: unknown): StatusSnapshot | null {
  if (raw === null || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (!isStatusLevel(r.overall)) return null
  if (typeof r.generated_at !== 'string') return null
  if (!Array.isArray(r.groups)) return null
  const groups = r.groups.map(parseGroup).filter((g): g is StatusGroup => g !== null)
  return { generated_at: r.generated_at, overall: r.overall, groups }
}

/** The state of one component or group, as a short label. */
export const STATUS_LABEL: Readonly<Record<StatusLevel, string>> = Object.freeze({
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  unknown: 'Unknown',
})

/** The overall state as a headline (a banner, a widget). One wording everywhere, so two surfaces never disagree. */
export const STATUS_HEADLINE: Readonly<Record<StatusLevel, string>> = Object.freeze({
  operational: 'All systems operational',
  degraded: 'Partial outage',
  down: 'Major outage',
  unknown: 'Status unknown',
})
