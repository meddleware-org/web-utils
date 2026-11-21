/**
 * Tests for the status snapshot parser and wording (`src/status.ts`): a response from the probe is untrusted, so the parser accepts a valid
 * shape, rejects a wrong one, coerces an unknown status to "unknown", strips markup characters from names, and drops nameless entries.
 */
import { describe, it, expect } from 'vitest'
import { STATUS_HEADLINE, STATUS_LABEL, parseSnapshot } from '../src/status.js'

/** A snapshot that is valid as sent. */
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
  // The snapshot is what platform-probe's `/api/status` answers; the status page and the dashboard both parse it with this function.
  it('accepts a valid snapshot', () => {
    const snap = parseSnapshot(VALID)
    expect(snap).not.toBeNull()
    expect(snap!.overall).toBe('operational')
    expect(snap!.groups[0]!.name).toBe('Core')
    expect(snap!.groups[0]!.components[0]!.name).toBe('API')
  })

  // The three shapes a broken or hostile response can take at the top level.
  it('returns null for non-objects', () => {
    expect(parseSnapshot(null)).toBeNull()
    expect(parseSnapshot('string')).toBeNull()
    expect(parseSnapshot(42)).toBeNull()
  })

  it('returns null when overall is missing or invalid', () => {
    expect(parseSnapshot({ generated_at: 'x', overall: 'ok', groups: [] })).toBeNull()
    expect(parseSnapshot({ generated_at: 'x', groups: [] })).toBeNull()
  })

  // A status that is not one of the four known values (here, injected markup) must never reach a page as a status.
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

  // Names are shown as text, so only the characters that could open a tag are removed; an ampersand is legitimate ("Identity & Access").
  it('strips angle brackets from group and component names, and keeps ampersands and quotes', () => {
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
    expect(snap!.groups[0]!.components[0]!.name).toBe('API &amp; DB')
  })

  it('keeps an ampersand and a quote in a name', () => {
    const snap = parseSnapshot({
      generated_at: '2026-09-01T00:00:00Z',
      overall: 'operational',
      groups: [{ name: 'Identity & Access', status: 'operational', components: [{ name: 'The "Sign-in" service', status: 'operational' }] }],
    })
    expect(snap!.groups[0]!.name).toBe('Identity & Access')
    expect(snap!.groups[0]!.components[0]!.name).toBe('The "Sign-in" service')
  })

  // A nameless entry cannot be shown or addressed, so it is dropped rather than rendered as an empty row.
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

  // The same rule for groups: one bad group must not take the page down or appear blank.
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

// One wording for every level, shared by the status page, the dashboard and any widget, so two surfaces can never disagree.
describe('status wording', () => {
  it('has one label and one headline for every level, so two surfaces never disagree', () => {
    const levels = ['operational', 'degraded', 'down', 'unknown'] as const
    for (const l of levels) {
      expect(STATUS_LABEL[l]).toBeTruthy()
      expect(STATUS_HEADLINE[l]).toBeTruthy()
    }
    expect(STATUS_HEADLINE.degraded).toBe('Partial outage')
    expect(Object.isFrozen(STATUS_LABEL)).toBe(true)
  })
})
