// Vitest settings: the helpers are framework-free, so the tests run in plain Node (no jsdom). A helper that needs a DOM takes it as a
// parameter (`triggerDownload(blob, name, doc)`) and the test passes a stand-in.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
