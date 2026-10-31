// A month grid: weeks starting on Monday, each day keyed `YYYY-MM-DD`.

export interface Cell {
  /** `YYYY-MM-DD`. */
  day: string
  /** Day of the month. */
  date: number
  inMonth: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')
const key = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

/** Weeks (Monday first) covering a month. `month` is 1 to 12. */
export function monthGrid(year: number, month: number): Cell[][] {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const start = new Date(Date.UTC(year, month - 1, 1 - lead))
  const weeks: Cell[][] = []
  for (let w = 0; w < 6; w++) {
    const week: Cell[] = []
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start.getTime() + (w * 7 + d) * 86_400_000)
      week.push({ day: key(cur), date: cur.getUTCDate(), inMonth: cur.getUTCMonth() === month - 1 })
    }
    if (w >= 4 && week.every((x) => !x.inMonth)) break
    weeks.push(week)
  }
  return weeks
}

export const shiftMonth = (year: number, month: number, by: number): { year: number; month: number } => {
  const d = new Date(Date.UTC(year, month - 1 + by, 1))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 }
}

/** Month and weekday names from Intl, so they follow the runtime's locale data rather than a hard-coded English list. */
const names = (options: Intl.DateTimeFormatOptions, count: number, at: (i: number) => number, locale: string): string[] => {
  const f = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' })
  return Array.from({ length: count }, (_, i) => f.format(new Date(at(i))))
}

/** The twelve month names, January first. */
export const monthNames = (locale = 'en-GB'): string[] => names({ month: 'long' }, 12, (i) => Date.UTC(2026, i, 1), locale)

/** The seven weekday names, Monday first (matching {@link monthGrid}). */
export const weekdayNames = (locale = 'en-GB', style: 'long' | 'short' = 'long'): string[] =>
  names({ weekday: style }, 7, (i) => Date.UTC(2024, 0, 1 + i), locale) // 1 Jan 2024 is a Monday

export const MONTHS = monthNames()
export const WEEKDAYS = weekdayNames()
