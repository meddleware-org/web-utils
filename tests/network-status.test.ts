import { describe, expect, it } from 'vitest'
import { networkAvailability } from '../src/index.js'

describe('networkAvailability', () => {
  it('reports mainnet as coming while no record has a mainnet key', () => {
    const n = networkAvailability({ gate: ['testnet'], sealed: ['testnet'] })
    expect(n.testnet).toEqual({ status: 'live', live: ['gate', 'sealed'], missing: [] })
    expect(n.mainnet).toEqual({ status: 'coming', live: [], missing: ['gate', 'sealed'] })
  })
  it('is partial until every product has a record, then live', () => {
    expect(networkAvailability({ gate: ['testnet', 'mainnet'], sealed: ['testnet'] }).mainnet).toEqual({ status: 'partial', live: ['gate'], missing: ['sealed'] })
    expect(networkAvailability({ gate: ['testnet', 'mainnet'], sealed: ['mainnet', 'testnet'] }).mainnet.status).toBe('live')
  })
  it('never calls an empty set of products live', () => {
    expect(networkAvailability({}).mainnet.status).toBe('coming')
  })
  it('ignores unknown keys such as localnet', () => {
    expect(networkAvailability({ gate: ['localnet'] }).testnet.status).toBe('coming')
  })
})
