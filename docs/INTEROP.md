# Open standards and interoperability: web-utils

Framework-free helpers (amounts, dates, safe URLs).

This page lists what the project speaks today, what is planned, what was considered and does not apply, where someone else can extend it, and what proves each claim. The platform-wide list is [Standards we use](https://meddleware.dev/platform/standards). A row appears there in the same change that turns a standard on.

## Spoken today

- RFC 3339 dates
- Exact amounts without floating point
- safeHref: only absolute http(s) URLs reach a link

## Planned

- An RFC 9457 problem-details parser and renderer

## Considered, not applicable

- An OpenID Connect client in the browser: browser apps do not hold tokens; the sign-in code flow belongs in the backend of each console, so it is not a shared browser helper

## Extension points

- Pure functions; import what you need

## What proves it

- its unit tests

_Maintained centrally with the platform's interoperability map; changes go through it so every repository says the same thing._
