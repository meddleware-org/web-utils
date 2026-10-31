/** `in_progress` → `in progress`: every underscore, not only the first. */
export const humanize = (snake: string): string => snake.replace(/_/g, ' ')

const BYTE_UNITS = ['KiB', 'MiB', 'GiB', 'TiB'] as const

/**
 * A byte count for people, in binary units: `512 B`, `12.3 KiB`, `4.0 MiB`. One decimal above a kibibyte; a negative, fractional or
 * non-finite count is shown as `—` rather than a made-up number.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${Math.floor(bytes)} B`
  let value = bytes
  let unit = -1
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(1)} ${BYTE_UNITS[unit]}`
}
