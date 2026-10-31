/** A file name safe to offer for download: word characters, dots and dashes only, no leading dots, at most 100 characters. */
export function safeFileName(label: string | undefined, fallback: string): string {
  const cleaned = (label ?? '').replace(/[^\w.-]/g, '_').replace(/^\.+/, '').slice(0, 100)
  return cleaned || fallback
}

/**
 * Offer a blob as a download. The object URL is released after a second, not at once: revoking straight after `click()` cancels the
 * download in some browsers.
 */
export function triggerDownload(blob: Blob, name: string, doc: Pick<Document, 'createElement'> = document): void {
  const url = URL.createObjectURL(blob)
  const a = doc.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
