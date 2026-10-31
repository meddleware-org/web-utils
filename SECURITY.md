# Security Policy

## Scope

This policy covers `@meddleware/web-utils`: pure helper functions for formatting, fetching and link safety. It has no runtime
dependencies, runs only inside a consumer's process, and makes network requests only when a consumer calls `fetchJson` or
`fetchWithTimeout` with a URL it chose.

It does not cover a consuming application.

## What it guarantees

- `safeHref` and `safePath` are the link allow-list the frontends bind to `href`: they accept `https:` (and `http:` on localhost),
  reject credentials, control characters, backslashes and every other scheme, and return the normalised URL that was checked.
  Names that wrap a validated URL (`suiExplorerUrl`, `walruscanBlobUrl`) encode the chain data they interpolate.
- Amount helpers are exact on bigint digits; they never round silently when parsing (`parseFixed` rejects excess precision).
- `parseSnapshot` strips HTML-sensitive characters from names and coerces unknown statuses; it is defence in depth, not a
  substitute for rendering text as text.

A consumer that disables the lint rules, or builds a URL by hand, is outside these guarantees.

## Supply chain

Releases are published from this repository's `npm-publish.yml` with npm trusted publishing (OIDC and provenance); tokens are not
used. A compromised release would run in every frontend, so report anything that suggests tampering.

## Supported versions

Only the latest published npm version receives fixes.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities. Use GitHub's private vulnerability reporting for this
repository, or email dev@meddleware.co.uk.
