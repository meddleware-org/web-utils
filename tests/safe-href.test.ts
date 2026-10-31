import { describe, it, expect } from 'vitest'
import { safeHref, safePath } from '../src/safe-href.js'

describe('safeHref', () => {
  it('passes https URLs, normalised', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com/')
    expect(safeHref('https://status.meddleware.co.uk')).toBe('https://status.meddleware.co.uk/')
    expect(safeHref('https://suivision.xyz/account/0xabc')).toBe('https://suivision.xyz/account/0xabc')
    expect(safeHref('HTTPS://Example.COM/A?b=1#c')).toBe('https://example.com/A?b=1#c')
  })

  it('passes http://localhost and http://127.0.0.1 (dev)', () => {
    expect(safeHref('http://localhost:8080')).toBe('http://localhost:8080/')
    expect(safeHref('http://127.0.0.1:4000/api')).toBe('http://127.0.0.1:4000/api')
  })

  it('rejects credentials in the authority (deceptive host)', () => {
    expect(safeHref('https://suivision.xyz@evil.com/account/0x1')).toBeUndefined()
    expect(safeHref('https://user:pass@example.com/')).toBeUndefined()
    expect(safeHref('https://suivision.xyz:443@evil.com/')).toBeUndefined()
  })

  it('rejects control characters, spaces and backslashes anywhere', () => {
    for (const bad of [
      ' https://example.com/',
      'https://example.com/ ',
      'https://exa\tmple.com/',
      'https://example.com/\n',
      'https://example.com/\u0000',
      'https://evil.com\\@good.com/',
      'https://example.com/a b',
    ]) {
      expect(safeHref(bad), JSON.stringify(bad)).toBeUndefined()
    }
  })

  it('rejects javascript: scheme', () => {
    expect(safeHref('javascript:alert(1)')).toBeUndefined()
    expect(safeHref('javascript:void(0)')).toBeUndefined()
  })

  it('rejects data: scheme', () => {
    expect(safeHref('data:text/html,<h1>x</h1>')).toBeUndefined()
  })

  it('rejects http:// on non-localhost hosts', () => {
    expect(safeHref('http://evil.com')).toBeUndefined()
    expect(safeHref('http://192.168.1.1')).toBeUndefined()
  })

  it('returns undefined for empty/null/undefined input', () => {
    expect(safeHref('')).toBeUndefined()
    expect(safeHref(null)).toBeUndefined()
    expect(safeHref(undefined)).toBeUndefined()
  })

  it('returns undefined for unparseable strings', () => {
    expect(safeHref('not a url')).toBeUndefined()
    expect(safeHref('//no-scheme')).toBeUndefined()
  })
})

describe('safePath', () => {
  it('passes single-slash paths, normalised', () => {
    expect(safePath('/legal/x.html')).toBe('/legal/x.html')
    expect(safePath('/legal/../legal/x.html?a=1#top')).toBe('/legal/x.html?a=1#top')
    expect(safePath('/')).toBe('/')
  })

  it('rejects everything that can leave the site', () => {
    for (const bad of [
      '//evil.com',
      '/\\evil.com',
      '/\t/evil.com',
      '/\n/evil.com',
      '/\r/evil.com',
      '/ /evil.com',
      '/\u0000/evil.com',
      'legal/x.html',
      'https://evil.com/',
      'javascript:alert(1)',
      '',
    ]) {
      expect(safePath(bad), JSON.stringify(bad)).toBeUndefined()
    }
    expect(safePath(null)).toBeUndefined()
    expect(safePath(undefined)).toBeUndefined()
  })
})

describe('safeIcon', () => {
  it('accepts the Wallet Standard image data URIs', async () => {
    const { safeIcon } = await import('../src/safe-href.js')
    for (const type of ['svg+xml', 'webp', 'png', 'gif']) {
      const icon = `data:image/${type};base64,AAAA`
      expect(safeIcon(icon), type).toBe(icon)
    }
    expect(safeIcon('DATA:IMAGE/PNG;BASE64,AAAA')).toBe('DATA:IMAGE/PNG;BASE64,AAAA')
  })

  it('refuses everything else', async () => {
    const { safeIcon } = await import('../src/safe-href.js')
    for (const bad of ['https://example.org/icon.png', 'javascript:alert(1)', 'data:text/html;base64,AAAA', 'data:image/png,AAAA', 'data:image/jpeg;base64,AAAA', ' data:image/png;base64,AAAA', '', undefined, null, 5, {}]) {
      expect(safeIcon(bad), String(bad)).toBeUndefined()
    }
  })
})
