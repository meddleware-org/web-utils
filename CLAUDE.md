# CLAUDE.md — @meddleware/web-utils

Framework-free TypeScript helpers shared by the frontends and client libraries. Source in `src/` (one module per concern, all
re-exported from `src/index.ts`); the package ships `src/` plus generated `.d.ts` in `dist/` (the same model as the client libraries).

## Invariants

- **No framework, no side effects at import, no runtime dependencies.** No Vue, no DOM access outside a function body, no
  `localStorage` read at module scope. Anything browser-only takes its dependency as a parameter or looks it up inside the call
  (`triggerDownload(blob, name, doc)`, `safeStorage()`), so the helpers run in Node, a worker and a browser.
- **Exact amounts.** Chain and money amounts are bigint digits (`parseFixed`/`formatFixed`); never `Number(x) / 1e9`. `formatCoinAmount`
  rounds half away from zero on the digits, so it is the same on every machine (the old float version was not).
- **Names are load-bearing.** `safeHref`, `safePath`, `safeIcon`, `suiExplorerUrl` and `walruscanBlobUrl` are the URL helpers that
  `@meddleware/eslint-config` accepts in template bindings (`URL_HELPERS`). Renaming one breaks every app's lint until the config
  changes with it.
- **Untrusted input is validated, not assumed.** `parseSnapshot`, `safeHref`, `safeStorage` readers, `fetchJson`: check the shape,
  return `null`/`undefined` or throw a message naming what failed; never partially apply.
- **Stale results are dropped, not applied.** Use `createGeneration` for "the latest call wins" and `createOperationScope` for "a state
  change invalidates what was started"; every `await` in an operation is followed by an `isCurrent` check.
- **One wording** for statuses (`STATUS_LABEL`, `STATUS_HEADLINE`) so two surfaces never disagree.
- **Every export is proven by a test** in both directions. Ported helpers keep their original tests (and the cases that found
  bugs in them); add a case with every fix.

## Where things came from

The helpers were each copied between repos before this package: `time`, `usd`, `calendar`, `fixed` (content-hub-ui), `coin`
(access-gate-ui `pricing.ts`, walrus-storage-kit `relay.ts`), `errors` and `fetch` (token-issuance-ui), `async` (sealed-storage-ui
`operation-scope.ts`, treasury/dao `latest`, walrus and access-gate generation counters), `download` (sealed-storage-ui),
`explorer`, `safe-href`, `truncate`, `status` (`@meddleware/ui`, which re-exports them so its API is unchanged), and the date
formatters of roadmap-site. A consumer deletes its copy and imports from here.

## Release

Bump `version`, push, tag `v<version>`; `npm-publish.yml` publishes with npm trusted publishing after `node-ci.yml` (audit, type-check,
lint, tests, build, package contents) and the `node24-compat` floor job pass. Consumers pin `^0.0.x`, an exact pin on 0.0.x, so
bump them together.

## Commands

```bash
npm ci && npm run type-check && npm run lint && npm test   # what CI checks, short of the build and the tarball check
npm run build && npm pack --dry-run                        # dist/*.d.ts and the tarball's file list
node .github/audit-gate.mjs                                # the dependency gate (an exact copy of design-tokens' file, FU-0196)
```

## Documentation rules (workspace documentation standard, D144)

Every file has a header and every declaration a TSDoc comment (private declarations included); comments say why. `node scripts/check-docs.mjs --report web-utils` (in the workspace repository) is the gate. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Related

- The audit: [`docs/audit/web-utils-audit.md`](docs/audit/web-utils-audit.md).
- Consumers: fifteen repositories take `^0.0.x` (the frontends, `ui`, `wallet-adapter`, `walrus-storage-kit`, `dev-site`); release the apps after this package.
- How to propose a change: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Interoperability

- [docs/INTEROP.md](docs/INTEROP.md): the standards this project speaks, what is planned, where to extend it, and what proves each claim.
