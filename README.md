# @meddleware/web-utils

Framework-free helpers shared by the MeddleWare frontends and client libraries. No Vue, no DOM at import time, no side effects,
no runtime dependencies. One entry, tree-shakeable named exports.

| Area | Exports |
| --- | --- |
| Exact amounts | `parseFixed`, `formatFixed` (bigint base units: exact, optional rounding, padding, grouping) |
| Coins | `suiToMist`, `mistToSui`, `formatCoinAmount`, `formatCoinExact`, `MIST_PER_SUI`, `COIN_DECIMALS` |
| Money | `formatUsd`, `parseUsd` (micro-US-dollars) |
| Time | `formatDateTime`, `formatDate`, `formatClock`, `formatWindow`, `toLocalInput`, `fromLocalInput`, `dayKey`, `offsetMinutes`, `isZone`, `browserZone` |
| Calendar | `monthGrid`, `shiftMonth`, `monthNames`, `weekdayNames`, `MONTHS`, `WEEKDAYS` |
| Async | `createGeneration` (the latest call wins), `createOperationScope` (explicit invalidation), `fetchJson`, `fetchWithTimeout`, `readBoundedText`, `readBoundedJson`, `HttpError` |
| Errors, text | `errorMessage`, `humanize`, `formatBytes`, `isObj`, `str` |
| Browser | `safeStorage`, `safeFileName`, `triggerDownload` |
| Links | `safeHref`, `safePath`, `safeIcon`, `suiExplorerUrl`, `walruscanBlobUrl`, `truncateMiddle` |
| Status | `parseSnapshot`, `isStatusLevel`, `STATUS_LABEL`, `STATUS_HEADLINE` and the `Status*` types |

## Why exact

A chain amount is a bigint count of base units. Going through `Number` loses precision above 2^53 and rounds ties by binary
representation, so the figure on screen can differ from the figure paid. `formatFixed` and friends work on the decimal digits:
the same on every machine, no float anywhere.

```ts
import { formatCoinAmount, formatCoinExact, suiToMist } from '@meddleware/web-utils'

suiToMist('0.0000005')            // 500n
formatCoinAmount(13_100_000n, 'WAL') // "0.0131 WAL"
formatCoinAmount(10_000n, 'SUI')     // "0.00001 SUI"  (a tiny amount is not shown as 0.0000)
formatCoinExact(10_000_001n, 'SUI')  // "0.010000001 SUI"  (what a person approves is what is paid)
```

## Stale results

```ts
const generation = createGeneration()
async function load() {
  const current = generation.begin()
  const rows = await fetchRows()
  if (!current()) return // a newer load started; drop this result
  state.rows = rows
}
```

`createOperationScope` is the variant where beginning an operation does not cancel others: only `invalidate()` (a network or
account change) does.

## Fetching

`fetchJson(url, { timeoutMs, fetcher, init, maxBytes })` asks for JSON without credentials or cache, bounds the headers and the body
by a timeout, throws `HttpError` (with `status`) for a non-2xx response, and names the URL for a timeout or invalid JSON.

## Links

`safeHref` returns a normalised `https:` URL (or `http:` on localhost) and `undefined` for anything else, including credentials,
control characters and other schemes. Bind a link to an element only through `safeHref`, `safePath`, `suiExplorerUrl` or
`walruscanBlobUrl`; `@meddleware/eslint-config` enforces it in templates.
