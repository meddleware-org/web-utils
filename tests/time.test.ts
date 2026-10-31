import { describe, expect, it } from 'vitest'
import { browserZone, dayKey, formatClock, formatDate, formatDateTime, formatWindow, fromLocalInput, isZone, offsetMinutes, toLocalInput } from '../src/time.js'

describe('time zones', () => {
  it('converts a wall time in a zone to the right UTC instant, either side of a clock change', () => {
    expect(fromLocalInput('2026-07-01T09:30', 'Europe/London')).toBe('2026-07-01T08:30:00.000Z') // BST
    expect(fromLocalInput('2026-12-01T09:30', 'Europe/London')).toBe('2026-12-01T09:30:00.000Z') // GMT
    expect(fromLocalInput('2026-07-01T09:30', 'America/New_York')).toBe('2026-07-01T13:30:00.000Z')
    expect(fromLocalInput('2026-03-01T09:30', 'Asia/Kolkata')).toBe('2026-03-01T04:00:00.000Z') // +05:30
    expect(fromLocalInput('2026-07-01T09:30', 'UTC')).toBe('2026-07-01T09:30:00.000Z')
  })

  it('handles the hour that does not exist and the hour that happens twice', () => {
    // Clocks go forward at 01:00 UTC on 2026-03-29 in London: 01:30 does not exist and moves forward by the gap.
    expect(fromLocalInput('2026-03-29T01:30', 'Europe/London')).toBe('2026-03-29T01:30:00.000Z')
    expect(toLocalInput('2026-03-29T01:30:00.000Z', 'Europe/London')).toBe('2026-03-29T02:30')
    // They go back at 01:00 UTC on 2026-10-25: 01:30 happens twice; the first one (BST) is taken.
    expect(fromLocalInput('2026-10-25T01:30', 'Europe/London')).toBe('2026-10-25T00:30:00.000Z')
  })

  it('round-trips and rejects nonsense', () => {
    for (const tz of ['UTC', 'Europe/London', 'America/Los_Angeles', 'Australia/Sydney']) {
      for (const iso of ['2026-01-15T10:00:00.000Z', '2026-06-15T10:00:00.000Z']) {
        expect(fromLocalInput(toLocalInput(iso, tz), tz)).toBe(iso)
      }
    }
    for (const bad of ['', 'tomorrow', '2026-13-01T10:00', '2026-02-31T10:00', '2026-02-10 10:00']) expect(fromLocalInput(bad, 'UTC')).toBeNull()
    expect(toLocalInput(null, 'UTC')).toBe('')
    expect(toLocalInput('not a date', 'UTC')).toBe('')
  })

  it('knows offsets, zones and day boundaries', () => {
    expect(offsetMinutes(Date.parse('2026-07-01T12:00:00Z'), 'Europe/London')).toBe(60)
    expect(offsetMinutes(Date.parse('2026-12-01T12:00:00Z'), 'Europe/London')).toBe(0)
    expect(isZone('Europe/London')).toBe(true)
    expect(isZone('Mars/Olympus')).toBe(false)
    expect(dayKey('2026-10-30T23:30:00Z', 'UTC')).toBe('2026-10-30')
    expect(dayKey('2026-10-30T23:30:00Z', 'Australia/Sydney')).toBe('2026-10-31')
    expect(typeof browserZone()).toBe('string')
  })
})

describe('dates for people', () => {
  it('shows an instant in the chosen zone, naming it; a string argument is the zone', () => {
    expect(formatDateTime('2026-07-01T08:30:00Z', 'Europe/London')).toContain('09:30')
    expect(formatDateTime('2026-07-01T08:30:00Z', { tz: 'Europe/London' })).toMatch(/1 Jul 2026, 09:30 (BST|GMT\+1)/)
    expect(formatDateTime('2026-12-01T08:30:00Z', { tz: 'Europe/London' })).toContain('08:30')
  })

  it('shows an instant in the runtime zone, naming it, when no zone is given', () => {
    expect(formatDateTime('2026-07-01T08:30:00Z')).toMatch(/1 Jul 2026/)
    expect(formatDateTime('2026-07-01T08:30:00Z')).toMatch(/[A-Z]{2,5}|GMT/)
  })

  it('shows what you ask for when there is nothing to show', () => {
    expect(formatDateTime(null, 'UTC')).toBe('—')
    expect(formatDateTime('nope')).toBe('—')
    expect(formatDateTime(null, { empty: '' })).toBe('')
    expect(formatDateTime('nope', { empty: '' })).toBe('')
    expect(formatDate(undefined, { empty: 'n/a' })).toBe('n/a')
    expect(formatClock('', { tz: 'UTC' })).toBe('—')
  })

  it('formats a date and a time of day', () => {
    expect(formatDate('2027-03-01T12:00:00Z', { tz: 'UTC' })).toBe('1 Mar 2027')
    expect(formatClock('2026-07-01T08:30:00Z', { tz: 'Europe/London' })).toBe('09:30')
    expect(formatClock('2026-07-01T23:05:00Z', { tz: 'UTC' })).toBe('23:05')
  })

  it('caches formatters per zone, so the same instant formats the same twice', () => {
    const a = formatDateTime('2026-07-01T08:30:00Z', { tz: 'America/New_York' })
    expect(formatDateTime('2026-07-01T08:30:00Z', { tz: 'America/New_York' })).toBe(a)
    expect(a).toContain('04:30')
  })

  it('writes a window as a range or one open end', () => {
    const tz = { tz: 'UTC' }
    expect(formatWindow('2026-10-01T12:00:00Z', '2027-01-31T12:00:00Z', tz)).toBe('1 Oct 2026 – 31 Jan 2027')
    expect(formatWindow('2026-10-01T12:00:00Z', null, tz)).toBe('From 1 Oct 2026')
    expect(formatWindow(null, '2027-01-31T12:00:00Z', tz)).toBe('Until 31 Jan 2027')
    expect(formatWindow(null, null)).toBe('')
  })
})
