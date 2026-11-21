// @meddleware/web-utils — framework-free helpers shared by the Meddleware frontends. No Vue, no DOM at import time, no side effects.
//
// This file only re-exports: one module per concern, so a consumer (or a bundler) can tell what it uses. The groups below are exact money
// (`fixed`, `coin`, `usd`), time (`time`, `calendar`), failure and race handling (`errors`, `async`, `fetch`), untrusted input (`storage`,
// `guards`, `safe-href`, `status`), display (`text`, `truncate`, `explorer`, `download`) and the network status the pages share
// (`network-status`). The URL helpers `safeHref`, `safePath`, `safeIcon`, `suiExplorerUrl` and `walruscanBlobUrl` are named in
// `@meddleware/eslint-config`'s `URL_HELPERS`: renaming one breaks every app's lint (CLAUDE.md, "Names are load-bearing").
// Every export is proven by a test in tests/.

// Exact money: bigint digits, never floating point.
export { parseFixed, formatFixed } from './fixed.js'
export type { FormatFixedOptions } from './fixed.js'
export { COIN_DECIMALS, MIST_PER_SUI, suiToMist, mistToSui, formatCoinAmount, formatCoinExact } from './coin.js'
export { formatUsd, parseUsd } from './usd.js'
export {
  isZone,
  browserZone,
  offsetMinutes,
  toLocalInput,
  fromLocalInput,
  dayKey,
  formatDateTime,
  formatDate,
  formatClock,
  formatWindow,
} from './time.js'
export type { FormatOptions } from './time.js'
export { monthGrid, shiftMonth, monthNames, weekdayNames, MONTHS, WEEKDAYS } from './calendar.js'
export type { Cell } from './calendar.js'
export { errorMessage } from './errors.js'
export { createGeneration, createOperationScope } from './async.js'
export type { Generation, OperationScope, OperationToken } from './async.js'
export { DEFAULT_MAX_JSON_BYTES, HttpError, fetchJson, fetchWithTimeout, readBoundedText, readBoundedJson } from './fetch.js'
export type { FetchJsonOptions } from './fetch.js'
export { safeStorage } from './storage.js'
export { isObj, str } from './guards.js'
export { formatBytes, humanize } from './text.js'
export { safeFileName, triggerDownload } from './download.js'
export { suiExplorerUrl, walruscanBlobUrl } from './explorer.js'
export type { SuiNetwork, SuiExplorerKind, WalrusExplorerNetwork } from './explorer.js'
export { safeHref, safePath, safeIcon } from './safe-href.js'
export { truncateMiddle, DEFAULT_TRUNCATE_CHARS } from './truncate.js'
export { isStatusLevel, parseSnapshot, STATUS_LABEL, STATUS_HEADLINE } from './status.js'
export type { StatusLevel, StatusComponent, StatusGroup, StatusSnapshot } from './status.js'
export { networkAvailability } from './network-status.js'
export type { ChainNetwork, NetworkAvailability, NetworkStatus } from './network-status.js'
