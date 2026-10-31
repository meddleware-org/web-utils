import { describe, it, expect } from 'vitest'
import { parseSnapshot } from '../src/status.js'

const VALID: unknown = {
  generated_at: '2026-09-01T00:00:00Z',
  overall: 'operational',
  groups: [
    {
      name: 'Core',
      status: 'operational',
      components: [{ name: 'API', status: 'operational' }],
    },
  ],
}

describe('parseSnapshot', () => {
  it('accepts a valid snapshot', () => {
    const snap = parseSnapshot(VALID)
    expect(snap).not.toBeNull()
    expect(snap!.overall).toBe('operational')
    expect(snap!.groups[0]!.name).toBe('Core')
    expect(snap!.groups[0]!.components[0]!.name).toBe('API')
  })

  it('returns null for non-objects', () => {
    expect(parseSnapshot(null)).toBeNull()
    expect(parseSnapshot('string')).toBeNull()
    expect(parseSnapshot(42)).toBeNull()
  })

  it('returns null when overall is missing or invalid', () => {
    expect(parseSnapshot({ generated_at: 'x', overall: 'ok', groups: [] })).toBeNull()
    expect(parseSnapshot({ generated_at: 'x', groups: [] })).toBeNull()
  })

  it('coerces unknown component status to "unknown"', () => {
    const raw = {
      generated_at: '2026-09-01T00:00:00Z',
      overall: 'operational',
      groups: [
        {
          name: 'Core',
          status: 'injected<script>',
          components: [{ name: 'API', status: 'injected<img>' }],
        },
      ],
    }
    const snap = parseSnapshot(raw)
    expect(snap).not.toBeNull()
    expect(snap!.groups[0]!.status).toBe('unknown')
    expect(snap!.groups[0]!.components[0]!.status).toBe('unknown')
  })

  it('strips HTML-sensitive characters from group and component names', () => {
    const raw = {
      generated_at: '2026-09-01T00:00:00Z',
      overall: 'degraded',
      groups: [
        {
          name: '<b>Core</b>',
          status: 'degraded',
          components: [{ name: 'API &amp; DB', status: 'degraded' }],
        },
      ],
    }
    const snap = parseSnapshot(raw)
    expect(snap!.groups[0]!.name).toBe('bCore/b')
    expect(snap!.groups[0]!.components[0]!.name).toBe('API amp; DB')
  })

  it('drops components with empty or missing names', () => {
    const raw = {
      generated_at: '2026-09-01T00:00:00Z',
      overall: 'operational',
      groups: [
        {
          name: 'Core',
          status: 'operational',
          components: [
            { name: '', status: 'operational' },
            { name: 'API', status: 'operational' },
            { status: 'degraded' }, // no name field
          ],
        },
      ],
    }
    const snap = parseSnapshot(raw)
    expect(snap!.groups[0]!.components).toHaveLength(1)
    expect(snap!.groups[0]!.components[0]!.name).toBe('API')
  })

  it('drops groups with empty names', () => {
    const raw = {
      generated_at: '2026-09-01T00:00:00Z',
      overall: 'operational',
      groups: [
        { name: '', status: 'operational', components: [] },
        { name: 'Core', status: 'operational', components: [] },
      ],
    }
    const snap = parseSnapshot(raw)
    expect(snap!.groups).toHaveLength(1)
    expect(snap!.groups[0]!.name).toBe('Core')
  })
})

describe('status wording', () => {
  it('has one label and one headline for every level, so two surfaces never disagree', async () => {
    const { STATUS_LABEL, STATUS_HEADLINE } = await import('../src/status.js')
    const levels = ['operational', 'degraded', 'down', 'unknown'] as const
    for (const l of levels) {
      expect(STATUS_LABEL[l]).toBeTruthy()
      expect(STATUS_HEADLINE[l]).toBeTruthy()
    }
    expect(STATUS_HEADLINE.degraded).toBe('Partial outage')
    expect(Object.isFrozen(STATUS_LABEL)).toBe(true)
  })
})
