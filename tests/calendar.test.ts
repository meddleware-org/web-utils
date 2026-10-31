import { describe, expect, it } from 'vitest'
import { MONTHS, WEEKDAYS, monthGrid, monthNames, shiftMonth, weekdayNames } from '../src/calendar.js'

describe('calendar', () => {
  it('lays out a month in Monday-first weeks', () => {
    const weeks = monthGrid(2026, 10) // 1 Oct 2026 is a Thursday
    expect(weeks[0]!.map((c) => c.date)).toEqual([28, 29, 30, 1, 2, 3, 4])
    expect(weeks[0]![3]!.day).toBe('2026-10-01')
    expect(weeks.flat().filter((c) => c.inMonth)).toHaveLength(31)
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    expect(weeks.at(-1)!.some((c) => c.inMonth)).toBe(true)
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 })
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 })
  })

  it('names months and weekdays from Intl, Monday first', () => {
    expect(MONTHS).toEqual(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
    expect(WEEKDAYS).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    expect(weekdayNames('en-GB', 'short')).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(monthNames('fr')[0]).toBe('janvier')
    expect(weekdayNames('de')[0]).toBe('Montag')
  })
})
