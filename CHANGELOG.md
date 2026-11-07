# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2026-11-07

### Added

- `networkAvailability`: which networks the platform is deployed on, from the deployment records.

## [0.0.2] - 2026-11-01

### Fixed

- `suiToMist` no longer rounds a number with more than nine decimals (`5e-10` was one MIST); numbers are written out exactly and refused
  like the string form.
- `fetchJson` caps the body at 1 MiB unless told otherwise (`DEFAULT_MAX_JSON_BYTES`; `maxBytes: Infinity` lifts it).
- `errorMessage` follows at most eight `cause` links, so a looping error object cannot overflow the stack.
- The `formatBytes` documentation matches its behaviour.
- `formatUsd` shows `—` for a value that is not a finite number (a field left out of a server's reply or an older audit record) instead of throwing `BigInt(NaN)` in the middle of a render.

## [0.0.1] - 2026-10-31

### Added

- First release: the helpers that the frontends each carried their own copy of, with their tests. Exact bigint amount formatting
  (`formatFixed`, coin and USD helpers; `formatCoinAmount` no longer goes through a float), time zone and date formatting with
  cached formatters, a month grid with Intl names, generation and operation-scope guards, bounded fetching, safe storage, links,
  downloads and file names, and the status snapshot parser with one shared wording.
