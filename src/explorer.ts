// Block-explorer URL builders — the single source of truth for where a UI links chain entities. `explorer.sui.io` was retired with
// no official replacement; the ecosystem standard is SuiVision (by BlockVision), and Walrus blobs are shown on Walruscan.
// Swap a base here to change every link at once. Every id is chain data, so it is encoded: it can only ever be one path segment.

/** Sui networks SuiVision serves. */
export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet'

/** The kind of Sui entity to link, mapped to SuiVision's URL path segment. */
export type SuiExplorerKind = 'account' | 'object' | 'txblock'

/** Walrus networks Walruscan serves. */
export type WalrusExplorerNetwork = 'mainnet' | 'testnet'

/** SuiVision origin per network (mainnet has no subdomain). */
const SUIVISION_ORIGIN: Record<SuiNetwork, string> = {
  mainnet: 'https://suivision.xyz',
  testnet: 'https://testnet.suivision.xyz',
  devnet: 'https://devnet.suivision.xyz',
}

/**
 * Build a SuiVision explorer URL for a Sui entity.
 *
 * @param kind - `account` (address), `object`, or `txblock` (transaction digest).
 * @param id - The address / object id / transaction digest.
 * @param network - Target network (default `testnet`).
 * @returns The full SuiVision URL, e.g. `https://testnet.suivision.xyz/account/0x…`.
 */
export function suiExplorerUrl(kind: SuiExplorerKind, id: string, network: SuiNetwork = 'testnet'): string {
  const origin = SUIVISION_ORIGIN[network] ?? SUIVISION_ORIGIN.testnet
  return `${origin}/${kind}/${encodeURIComponent(id)}`
}

/** A Walrus blob on Walruscan, the Walrus-native explorer (SuiVision handles Sui entities). */
export function walruscanBlobUrl(network: WalrusExplorerNetwork, blobId: string): string {
  return `https://walruscan.com/${encodeURIComponent(network)}/blob/${encodeURIComponent(blobId)}`
}
