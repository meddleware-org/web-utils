# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-10-31

### Added

- First release: the helpers that the frontends each carried their own copy of, with their tests. Exact bigint amount formatting
  (`formatFixed`, coin and USD helpers; `formatCoinAmount` no longer goes through a float), time zone and date formatting with
  cached formatters, a month grid with Intl names, generation and operation-scope guards, bounded fetching, safe storage, links,
  downloads and file names, and the status snapshot parser with one shared wording.
