/** Default `[prefix, suffix]` character counts: `0x` plus 10 hex characters, then the last 10 (32-byte ids). */
export const DEFAULT_TRUNCATE_CHARS: readonly [number, number] = [12, 10]

/**
 * Shorten the middle of a long value (`0x1234567890…abcdef0123`) for display.
 *
 * - A value that is not longer than `prefix + suffix` is returned whole: the ellipsis would hide nothing.
 * - A zero count drops that side (`[8, 0]` → `0x123456…`), where `slice(-0)` would return the whole value.
 * - Counts are clamped to non-negative integers.
 *
 * Truncation is a convenience for scanning, not for verifying: address-poisoning attacks plant addresses
 * that match the first and last few characters. Where a user decides where funds go, show the whole value
 * (`:truncate="false"` on `CopyableAddress` / `ExplorerLink`).
 */
export function truncateMiddle(value: string, chars: readonly [number, number] = DEFAULT_TRUNCATE_CHARS): string {
  const pre = Math.max(0, Math.trunc(chars[0]) || 0)
  const suf = Math.max(0, Math.trunc(chars[1]) || 0)
  if (value.length <= pre + suf) return value
  return `${pre > 0 ? value.slice(0, pre) : ''}…${suf > 0 ? value.slice(-suf) : ''}`
}
