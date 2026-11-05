# Security Audit — `web-utils`

**Classification:** Internal security review (first-pass baseline; awaiting external review)
**Project:** repos/web-utils (`@meddleware/web-utils`) — framework-free helpers shared by every frontend and client library: exact bigint amounts, dates and time zones, bounded fetch, stale-result guards, safe link and storage helpers, status parsing.
**Project type:** TS library (ships `src/` and generated `.d.ts`; no runtime dependencies)
**Template:** AUDIT_TEMPLATE.md (2026-11-01) + AUDIT_TEMPLATE_TS.md (2026-11-01). Not triggered: `AUDIT_TEMPLATE_SUI_CLIENT.md` — the package builds explorer links and formats amounts, but never builds or signs a PTB, reads Move objects or events, or verifies a Sui signature (the chain is only ever *named* in a URL); `AUDIT_TEMPLATE_VUE.md` and `AUDIT_TEMPLATE_A11Y.md` — no Vue, no rendering (the helpers return strings; the consumer renders them); `AUDIT_TEMPLATE_IMG.md` — no image.
**Deployment status:** npm `@meddleware/web-utils` 0.0.1 (released 2026-10-31, tag `v0.0.1`, publish run green, provenance attestation present on the registry — `slsa.dev/provenance/v1` — checked 2026-11-01). The registry also lists two placeholder versions, `0.0.0-rename.0` and `0.0.0-stage`, from the name reservation (F6). Unreleased on `main`: the fixes of this audit (F1–F4), which ship as 0.0.2. Consumers (all `^0.0.1`, an exact pin on 0.0.x): ui, wallet-adapter, walrus-storage-kit, access-gate-ui, dashboard-ui, landing-site, roadmap-site, content-hub-ui, treasury-ui, status-ui, token-issuance-ui, sealed-storage-ui, walrus-storage-ui.
**Review date:** 2026-11-01
**Reviewer:** Internal review
**Severity ceiling:** Medium — the package holds no keys, makes no request of its own, and decides nothing on-chain. The worst realistic defect is a wrong amount or a mis-validated link shown or submitted by a consumer, and every consumer's amount still passes the wallet prompt and the chain.
**Status:** first-pass baseline 2026-11-01 (0.0.2 prepared) (the package was extracted from copies in ten repos on 2026-10-31; this is its first audit). 8 findings (2 Positive): 5 RESOLVED in source (released with 0.0.2), 1 ADJUDICATED, 1 DEFERRED (maintainer-only).

---

## Executive summary

`web-utils` is the single home of the small helpers that every frontend used to copy: `parseFixed`/`formatFixed` and the SUI/WAL amount layer built on them, `formatUsd`, date and time-zone conversion, `fetchJson` with a timeout and a size cap, the generation and operation-scope guards that drop stale async results, `safeHref`/`safePath`/`safeIcon` (the URL allow-list that `@meddleware/eslint-config` accepts in template bindings), `suiExplorerUrl`/`walruscanBlobUrl`, `parseSnapshot`, `safeStorage` and `safeFileName`/`triggerDownload`.

Risk concentrates in two places: **amounts** (a rounding or parsing slip moves money in a consumer) and **URL validation** (a bypass becomes script or phishing in every app). Both held on review. All money arithmetic is on bigint digits; the link helpers reject credentials, control characters, backslashes, every scheme but `https:` (and `http:` on loopback) and protocol-relative paths, and are covered by two-direction tests that include the `/<TAB>/host` and `https://suivision.xyz@evil.com` cases.

Five defects were found and fixed inline:

- **F1** — `suiToMist(number)` silently rounded a number with more than nine decimals (`5e-10` became 1 MIST) although its doc and the string path reject it: a form value could be accepted that the string form refuses.
- **F2** — `fetchJson` read the whole body unless the caller passed `maxBytes`; no caller did. The default is now 1 MiB.
- **F3** — `errorMessage` recursed through `cause` without a bound, so a wallet-thrown object whose cause is itself overflowed the stack inside an error handler.
- **F4** — the `formatBytes` doc contradicted its tested behaviour.
- **F8** — `formatUsd` threw on a value that is not a finite number (found reading content-hub-ui's audit-trail rendering).

The package is pre-mainnet and its only open item is maintainer housekeeping: the two placeholder npm versions (F6). Nothing here is gated on mainnet.

## Threat model / trust boundaries

| Actor / source | What it controls | Bounded by |
| --- | --- | --- |
| Consumer code (apps, client libraries) | which helper is called with what | the helpers validate or throw; lint (`suiBoundary`) forces URL sinks through `safeHref`/`safePath`/`safeIcon`/`suiExplorerUrl`/`walruscanBlobUrl` |
| Data that reaches a helper: chain data, relay/aggregator responses, wallet-supplied icons and errors, `localStorage`, URL parameters | strings of any shape and size | shape checks, URL parser normalisation, size cap, `null`/`undefined` on failure (never a partial result) |
| Remote JSON endpoints a consumer chooses (`fetchJson`) | body size, timing, content | timeout, size cap (F2), `credentials: 'omit'`, parse-or-throw |
| npm registry / this repo's publish authority | the bytes every frontend installs | trusted publishing + provenance, tag-gated CI, `files` whitelist (B.2) |
| The build environment of a consumer | which version resolves | lockfiles, `^0.0.x` (exact on 0.0.x) |

**Primary trust anchor:** the repository's CI-gated trusted publisher. A compromised release would run in every frontend, so publication authority is the asset (SECURITY.md says so).

### Supply chain & input matrix (TS lens)

| Input | Producer | Validation | Failure mode |
| --- | --- | --- | --- |
| amount text | a form field | `parseFixed` regex, ≤ `decimals` fraction digits | `null` / throws; never rounds |
| amount number | `type="number"` `v-model` | written out as a decimal, then the same parse (F1) | throws |
| URL | chain, wallet, relay, config | `URL` parser + scheme/host/credential/control-char checks | `undefined` — consumer renders no `href` |
| JSON body | HTTP endpoint | status, timeout, 1 MiB cap (F2), `JSON.parse` | throws with the label named |
| stored value | `localStorage` | `safeStorage()` returns `null` when blocked; shapes checked by `isObj`/`str` at the consumer | consumer falls back to default |
| thrown value | wallet extension | `errorMessage` accepts any shape, bounded recursion (F3) | message string |

## Severity scale

Critical / High / Medium / Low / Info / Positive — unchanged across the corpus.

## Scope

In scope: `src/*.ts` (16 modules, 1 re-export index), `tests/*.ts` (15 files), `package.json` (`files`, `exports`, scripts), `.github/` (workflows, `audit-gate.mjs`, `audit-allowlist.json`, `dependabot.yml`), `SECURITY.md`, `CLAUDE.md`, the published tarball (`npm pack --dry-run`), the registry record (versions, provenance).

Out of scope: consumers' use of the helpers (each consumer's audit), the lint rule that enforces the URL helpers (eslint-config audit), the design tokens, anything rendered.

Environment and commands (2026-11-01, Node 26, npm 12): `npm ci`; `npm ls --all`; `node .github/audit-gate.mjs` (0 high/critical); `npm run type-check`; `npm run lint`; `npx vitest run` (15 files, 97 tests after the fixes; 93 before); `npm run build`; `npm pack --dry-run --json`; `npm view @meddleware/web-utils versions dist.attestations.provenance`.

## Findings

### F1 — `suiToMist(number)` rounded numbers with more than nine decimals
**Severity:** Medium   **Disposition:** RESOLVED
**Where:** `src/coin.ts::suiToMist` (the `number` branch).
**Issue:** the number branch converted with `sui.toFixed(9)` and then parsed the string. `toFixed` rounds, so `suiToMist(5e-10)` was `1n` (0.000000001 SUI), `suiToMist(1.0000000006)` was `1_000_000_001n`, and `suiToMist(0.1 + 0.2)` was `300_000_000n`. The function's doc says it "throws on anything that is not a non-negative amount with at most 9 decimals", and the string branch does: `suiToMist('0.0000000001')` throws "more than 9 decimal places". The same price entered as a `type="number"` value (which Vue casts to a number) was accepted and rounded.
**Impact:** access-gate-ui calls it for a gate price (`CreateGateForm.vue`, `GateSettingsPanel.vue`). A value the string form refuses became a price one MIST off from what was typed. Bounded: the wallet prompt shows the amount, and sub-MIST input is far below any real price — but a rounding path in an amount converter is exactly what this package exists to remove.
**Remediation / evidence:** the number branch now writes the number out as the decimal it stands for (`String(n)`, with an exponent form such as `5e-7` or `1e+21` expanded to plain digits) and feeds the same parser as strings, so a number is exact or rejected. Tests added in `tests/coin.test.ts`: `1e-9` → `1n`, `1e21` → exact, `123.456` → `123_456_000_000n`, and `5e-10`, `1.0000000006`, `0.1 + 0.2` throw. 0.0.2.

### F2 — `fetchJson` had no default size cap
**Severity:** Low   **Disposition:** RESOLVED
**Where:** `src/fetch.ts::fetchJson`.
**Issue:** the bounded reader existed (`readBoundedJson`) but `fetchJson` used it only when the caller passed `maxBytes`; otherwise it called `res.json()` on an unbounded body. Both in-repo callers (`ui` `useStatusSnapshot`, `roadmap-site` `RoadmapView`) passed none. The module's own header promises "a response body is read with a size cap before it is parsed".
**Impact:** a misbehaving or compromised endpoint (or a hijacked path on a shared host) could return a body of any size, stalling or exhausting a tab. Both live documents are 0.4–2 KB (checked: status 408 B, roadmap 2.1 KB, snapshot 1.1 KB on 2026-11-01).
**Remediation / evidence:** `maxBytes` defaults to the exported `DEFAULT_MAX_JSON_BYTES` (1 MiB, hundreds of times the largest document read); `Infinity` lifts it. The unbounded `res.json()` path is gone, so every read goes through `readBoundedJson` (declared `Content-Length` checked first, then a streamed count). Test: a 1 MiB+ body is refused by default and accepted with `maxBytes: Infinity`. 0.0.2.

### F3 — `errorMessage` followed `cause` without a bound
**Severity:** Low   **Disposition:** RESOLVED
**Where:** `src/errors.ts::errorMessage`.
**Issue:** a plain object with `cause` pointing at itself (or an `Error` whose `cause` is itself) recursed until the stack overflowed. Wallet extensions throw arbitrary objects, and `errorMessage` runs inside catch blocks.
**Impact:** a `RangeError` thrown from the error handler hides the original failure and can leave a UI stuck in its busy state. Needs a hostile or buggy extension.
**Remediation / evidence:** the walk is capped at 8 links; behaviour for every non-looping shape is unchanged (existing tests untouched). New test covers both looping shapes. 0.0.2.

### F4 — `formatBytes` documentation contradicted its behaviour
**Severity:** Info   **Disposition:** RESOLVED
**Where:** `src/text.ts`.
**Issue:** the comment said a "fractional" count is shown as `—`. The code (and `tests/text.test.ts`: `12.3 * 1024` → `12.3 KiB`) formats it. The code is right (sizes divide to fractions); only negative and non-finite counts give `—`.
**Remediation / evidence:** comment corrected. 0.0.2.

### F5 — `suiExplorerUrl` and `walruscanBlobUrl` trust their TypeScript types for the kind and network
**Severity:** Info   **Disposition:** ADJUDICATED
**Where:** `src/explorer.ts`.
**Issue:** `kind` and (for Walruscan) `network` are interpolated into the path; only `id`/`blobId` are encoded. A consumer that passes a runtime string through a cast bypasses the union. For Sui, an unknown `network` falls back to testnet; for Walruscan the network is URL-encoded, so it can only ever be one path segment.
**Impact:** none exploitable: the origin is a constant, every dynamic part is a single encoded path segment or a union member, and the lint rule requires these helpers at the sink. Link text built from chain data is the consumer's to render as text.
**Remediation / evidence:** adjudicated — runtime re-validation of a closed union adds nothing the encoding does not already give. Tests assert the encoding of hostile ids.

### F8 — `formatUsd` threw on a value that is not a finite number
**Severity:** Low   **Disposition:** RESOLVED
**Where:** `src/usd.ts::formatUsd`.
**Issue:** `formatUsd(micros)` went through `BigInt(Math.abs(Math.trunc(micros)))`, which throws `RangeError` for `NaN`, `undefined` or a non-number. Its consumers render server data: content-hub-ui's `describeChange` formats cap values from audit-trail JSON that it type-checks only by key presence, so one record with a missing or older-shaped field would throw inside a render and blank the Budgets view. The sibling formatters (`formatBytes`, `formatDateTime`) already show `—` for such input.
**Impact:** a blank console section (not wrong money: nothing was shown) when the operator's own server returns an unexpected shape.
**Remediation / evidence:** a value that is not a finite number is shown as `—`; test (`undefined`, `null`, `NaN`, `Infinity`, a numeric string). 0.0.2.

### F6 — Placeholder npm versions
**Severity:** Info   **Disposition:** DEFERRED
**Where:** npm registry — `0.0.0-rename.0`, `0.0.0-stage`.
**Issue:** created by the name-reservation procedure (`scripts/npm-rename.sh place`, PUBLISHING.md: `0.0.0-rename.0` under the `placeholder` tag, plus `0.0.0-stage`) before the trusted publisher existed; eighteen packages carry the same pair. They are installable by exact version only (`latest` is the real release) and contain no code.
**Remediation / evidence:** deprecate them with a message pointing at the latest release (`npm deprecate`) — a credentialed npm action, so it is the maintainer's: `OPERATOR_TASKS.md`, npm housekeeping item 3, with the exact command and the list of all eighteen packages. Cosmetic; not a mainnet gate.

### F7 — Positive: link allow-list, exact amounts and stale-result guards are tested in both directions
**Severity:** Positive
**Where:** `tests/safe-href.test.ts` (13 cases), `tests/fixed.test.ts`, `tests/coin.test.ts`, `tests/async.test.ts`, `tests/operation-scope.test.ts`.
**Evidence:** `safeHref` rejects credentials, C0 controls/space/DEL/backslash, `javascript:`, `data:`, `http:` off loopback, and returns the *normalised* `URL.href`, so what is rendered is what was checked; `safePath` rejects `//host`, `/\host`, `/<TAB>/host` and anything resolving off a stand-in origin; amounts stay exact beyond 2^53; `createGeneration`/`createOperationScope` have separate semantics (latest wins vs. invalidate-all) and each is tested. Ported helpers kept their original tests (and the cases that found bugs in them).

---

## Section A — Invariant verification matrix

| # | Invariant | Enforced at | Proven by | Status |
| --- | --- | --- | --- | --- |
| I1 | Parsing an amount never rounds: more than `decimals` fraction digits, negative, exponent and empty input are refused | `fixed.ts::parseFixed`, `coin.ts::suiToMist` | `fixed.test.ts`, `coin.test.ts` (string and number forms, see F1) | HOLDS |
| I2 | Formatting an amount is exact unless `maxFraction` is given, and then rounds half away from zero on the digits (machine-independent) | `fixed.ts::formatFixed`, `coin.ts::formatCoinAmount` | `fixed.test.ts`, `coin.test.ts` (beyond 2^53) | HOLDS |
| I3 | `safeHref` returns only a normalised `https:` (or loopback `http:`) URL without credentials, controls or backslashes | `safe-href.ts` | `safe-href.test.ts` | HOLDS |
| I4 | `safePath` returns only a single-slash, same-site path | `safe-href.ts` | `safe-href.test.ts` | HOLDS |
| I5 | `safeIcon` returns only a base64 `data:image/(svg+xml\|webp\|png\|gif)` URI | `safe-href.ts` | `safe-href.test.ts` | HOLDS |
| I6 | No network read is unbounded in time or size | `fetch.ts` (timeout; `DEFAULT_MAX_JSON_BYTES`) | `fetch.test.ts` | HOLDS (F2) |
| I7 | A stale async result is dropped, not applied | `async.ts` | `async.test.ts`, `operation-scope.test.ts` | HOLDS |
| I8 | Untrusted structured input is validated or refused whole (`parseSnapshot`, `isObj`, `str`) | `status.ts`, `guards.ts` | `status.test.ts`, `misc.test.ts` | HOLDS |
| I9 | `safeStorage()` never throws, whatever the browser's storage policy | `storage.ts` | `misc.test.ts` | HOLDS |
| I10 | No import-time side effect, no runtime dependency, no DOM access outside a function body | whole `src/`, `package.json` (`dependencies` absent, `sideEffects: false`) | `npm ls --all`; code review | HOLDS (code-only) |
| I11 | Error extraction terminates on any thrown value | `errors.ts` | `errors.test.ts` | HOLDS (F3) |

## Section B — Supply-chain, publish-authority & capability matrix

### B.1 Dependency & CVE risk

| Dependency | Pinned version | Liveness dependency? | CVE / audit status | Notes |
| --- | --- | --- | --- | --- |
| runtime dependencies | none | — | — | the package ships its own source |
| dev: `typescript` ~6.0.3, `vitest` ~5.0.5, `eslint` ^10.13, `typescript-eslint` ^8.72, `jiti`, `@types/node` | lockfile | none at runtime | `audit-gate.mjs`: 0 high/critical (2026-11-01) | dev-only |
| platform APIs: `URL`, `Intl.DateTimeFormat`, `AbortSignal.timeout`, `TextDecoder`, `fetch` | the consumer's browser/Node | `fetchJson` fails closed (throws) if absent | within the browserslist promise (D101) | `AbortSignal.timeout` needs Safari 16+ / Chrome 103+, inside the promise |

### B.2 Publish authority & CI

| Authority | Held by | Custody | Gates | Rotation |
| --- | --- | --- | --- | --- |
| npm publish | GitHub Actions OIDC trusted publisher for `meddleware-org/web-utils`, workflow `npm-publish.yml` | no token anywhere | tag `v*`, `verify` job = `node-ci.yml` on the tagged commit | none needed; revoke the trusted publisher on suspicion |

#### CI & release integrity

- **Actions pinned** — HOLDS: every `uses:` is a full SHA with a version comment (`checkout` v7.0.1, `setup-node` v7.1.0).
- **Least privilege** — HOLDS: `permissions: contents: read` at the top of both workflows; `id-token: write` only on `publish-npm`.
- **OIDC trusted publishing / provenance** — HOLDS: `npm publish --provenance`; npm 11.20.0 pinned for the publish job; provenance present on the registry.
- **Tag-gated, idempotent publish** — HOLDS: tag must equal `package.json` version; a registry 200 for the version skips the publish.
- **Release gate equals CI** — HOLDS: `verify` calls `node-ci.yml` (`workflow_call`).
- **Automated dependency updates** — HOLDS: `dependabot.yml` covers npm and github-actions, grouped weekly (added 2026-11-01).
- **Secrets never echoed** — HOLDS: no secrets used.
- **Real funds** — N/A.
- **Test-only modes** — N/A: no build mode.
- **Workflow lint** — GAP closed: `node-ci.yml` had no `actionlint` step (frontend-config and vitepress-theme do); added with the same digest-pinned image. See F-check in the log.

### B.TS-1 Packaging

`files`: `src`, `dist`, `CHANGELOG.md`, `SECURITY.md`. `npm pack --dry-run`: 39 files, 17 KiB — `src/*.ts`, `dist/*.d.ts`, `package.json`, `LICENSE`, `README.md`, `CHANGELOG.md`, `SECURITY.md`; no tests, no `.github`, no config. CI asserts the whitelist (`unexpected files in the tarball`). `exports` `.` → types `dist/index.d.ts`, default `src/index.ts` (ships source, like the client libraries; consumers compile it, which their `tsc` settings must accept — proven by the consumers' CI). `sideEffects: false` is accurate (no import-time effect).

### B.TS-2 Install-time code

No lifecycle script other than `prepublishOnly: npm run build`. No `overrides`, no `allowScripts`.

### B.TS-3 Supply-chain gates

Lockfile committed; CI installs with `npm ci`; `audit-gate.mjs` runs in CI and (through `verify`) in the publish workflow with an empty allowlist; no `--omit=dev`. First-party shared-tooling rule: N/A (this is a runtime library, not tooling).

## Section C — Test-coverage & hermetic/live split

### C.1 Coverage grade — A (97 tests, 15 files, vitest, 2026-11-01)

| Dimension | Assessment |
| --- | --- |
| Happy path | covered for every export |
| Error / failure paths | covered: invalid amounts, non-2xx, timeout, invalid JSON, oversized body (declared and streamed), looping `cause`, blocked storage |
| Boundary / edge | beyond 2^53, sub-MIST, exponent forms, DST gaps and overlaps (`time.test.ts`), month grids, empty/null inputs |
| Security-relevant | URL bypass vectors (`/<TAB>/host`, userinfo, backslash, mixed scheme), hostile ids in explorer URLs |

The tests were ported with the helpers; the cases that found past bugs in the originals travel with them. No coverage tool is installed (`@vitest/coverage-v8` is not a dev dependency); counts and the two-direction rule stand in for a percentage (suggestion S1).

### C.2 Hermetic vs. live paths

Everything is hermetic (injected `fetcher`, fake time zones through `Intl`). The one live fact — the real sizes of the documents `fetchJson` reads — was checked by hand against the live hosts on 2026-11-01 (F2). `triggerDownload` is exercised with a stub document; real downloads are exercised by the consumers' e2e.

## Section D — Deployment-readiness gates

### pre-localnet
- [x] builds; unit tests, lint and type-check green; no secrets in source
- [x] deps install clean (`npm ci`, `npm ls --all`)

### pre-testnet
- [x] published with provenance; consumers live on testnet
- [x] CI gates green (audit, type-check, lint, test, build, package contents, Node 24 floor)
- [x] `SECURITY.md` present
- [ ] fixes F1–F4 released (0.0.2) — in this wave
- [ ] placeholder versions deprecated (F6) — maintainer

### pre-mainnet
- [ ] external review
- [ ] at go-live every package is renumbered 0.2.0 (versioning policy)

## Cross-project themes

- **Supply chain & release integrity** — see B.2; the lockfile is committed; no mutable reference.
- **Wire-format coupling & conformance vectors** — none: no wire format. The *names* `safeHref`, `safePath`, `safeIcon`, `suiExplorerUrl`, `walruscanBlobUrl` are load-bearing for `@meddleware/eslint-config` (`URL_HELPERS`); a rename breaks every app's lint until both change together (documented in CLAUDE.md).
- **On-chain-truth boundary** — the package decides nothing on-chain. Formatted amounts are *displays* of exact digits the chain returned; `formatCoinAmount` rounds for display and `formatCoinExact` is for the amount a person approves.
- **Deployment readiness** — Section D.
- **Chain-access layering** — no PTBs, no package IDs; the explorer base URLs are constants.
- **Versioning policy** — patch-only until mainnet; F1–F4 ship as 0.0.2.

## Normative requirements (MUST / MUST NOT)

- **WU-M1** MUST NOT round when parsing an amount; every parser either returns the exact base-unit value or refuses (I1, F1).
- **WU-M2** MUST return only normalised, allow-listed URLs from `safeHref`/`safePath`/`safeIcon`, and `undefined` otherwise (I3–I5).
- **WU-M3** MUST bound every network read by time and size (I6, F2).
- **WU-M4** MUST keep zero runtime dependencies and no import-time effect (I10).
- **WU-M5** MUST publish only through the tag-gated trusted-publisher workflow, with provenance (B.2).
- **WU-M6** MUST keep the helper names the lint rule accepts in step with `@meddleware/eslint-config`.

## Implementation suggestions (SHOULD / MAY)

- **S1** SHOULD add `@vitest/coverage-v8` and a floor on branch coverage for `src/` once the module set is stable.
- **S2** MAY add a property test for `parseFixed`/`formatFixed` round-trips.
- **S3** MAY make `suiExplorerUrl` re-validate its union at runtime (F5) if a consumer is ever found casting.

## Open questions (`OQ#`)

- **OQ1** — Should `DEFAULT_MAX_JSON_BYTES` be a tighter default (e.g. 256 KiB) now that the largest live document is 2 KB? The 1 MiB default is chosen to be safe for future snapshot growth; a consumer that wants less passes `maxBytes`.

## Risks

- A compromised publish would reach every frontend at once (trusted-publisher scope is the control; SECURITY.md asks reporters to flag tampering).
- The helpers define what "safe link" means for the whole platform; a bypass found later needs a patch and a coordinated consumer bump (`^0.0.x` ranges do not take the next patch).
- Browser `Intl` data differs by engine; time-zone output (not amounts) can differ between browsers within the same promise.

## Re-verification log

- 2026-11-01 — first-pass baseline. Read every module and test; ran `npm ci`, `npm ls --all`, the audit gate (0), type-check, lint, `vitest` (93 → 97 tests), build and `npm pack --dry-run`; checked the registry (versions, provenance) and the live sizes of the three documents `fetchJson` reads; confirmed the consumer list from the consumers' manifests. Fixed F1–F4 in source (0.0.2, unreleased at the time of writing), added the actionlint step and dependabot parity. F6 handed to `OPERATOR_TASKS.md`.
