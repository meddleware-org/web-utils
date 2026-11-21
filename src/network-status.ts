/** A chain a Meddleware tool can run against. */
export type ChainNetwork = 'testnet' | 'mainnet' | 'localnet'

/** How far a network is deployed. `live`: every product has a deployment record there; `partial`: some do; `coming`: none does. */
export type NetworkStatus = 'live' | 'partial' | 'coming'

/** One network's deployment state: its status, and which products are (and are not) deployed there. */
export interface NetworkAvailability {
  readonly status: NetworkStatus
  /** The products with a deployment record on this network. */
  readonly live: readonly string[]
  /** The products without one. */
  readonly missing: readonly string[]
}

/**
 * Which networks the platform is deployed on, from the deployment records and nothing else. A product's record lists the networks it is
 * published on (the keys of its `*_DEPLOYMENTS` object); adding a `mainnet` key to every record is the one switch that turns
 * mainnet on in the dashboard selector, the landing page and the docs, so no page can claim a network the records do not have.
 *
 * ```ts
 * const net = networkAvailability({
 *   'access gate': Object.keys(ACCESS_GATE_DEPLOYMENTS),
 *   'sealed storage': Object.keys(SEAL_POLICIES_DEPLOYMENTS),
 * })
 * net.mainnet.status // 'coming' until both records have a mainnet key
 * ```
 *
 * `localnet` is a developer network with no records: it is not reported here.
 * @param products - each product's name, with the networks its deployment record lists
 * @returns the state of testnet and of mainnet
 */
export function networkAvailability(products: Readonly<Record<string, readonly string[]>>): Readonly<Record<'testnet' | 'mainnet', NetworkAvailability>> {
  const names = Object.keys(products)
  /** One network's state across all products. */
  const report = (network: string): NetworkAvailability => {
    const has = (p: string) => products[p]?.includes(network) ?? false
    const live = names.filter(has)
    const missing = names.filter((p) => !has(p))
    // An empty set of products is never "live": with nothing to deploy there is nothing to claim.
    const status: NetworkStatus = names.length > 0 && missing.length === 0 ? 'live' : live.length > 0 ? 'partial' : 'coming'
    return { status, live, missing }
  }
  return { testnet: report('testnet'), mainnet: report('mainnet') }
}
