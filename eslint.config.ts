// ESLint configuration (`npm run lint`) for this library: typescript-eslint's recommended rules over the source and the tests. No Vue and no
// browser-compatibility plugins: the package runs in Node, a worker and a browser, and the consumers' own lint covers what they bundle.
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

// Flat ESLint config for a TypeScript library (no Vue SFCs): typescript-eslint's recommended rules.
export default defineConfig(
  // Build output and generated declarations are not source.
  globalIgnores(['**/dist/**', '**/coverage/**', '**/*.d.ts']),
  {
    name: 'web-utils/typescript',
    files: ['**/*.{ts,mts,tsx}'],
    extends: [tseslint.configs.recommended],
  },
  {
    // Tests use deliberately loose typing for mocks and hostile inputs.
    name: 'web-utils/test-overrides',
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    name: 'web-utils/overrides',
    files: ['**/*.{ts,mts,tsx}'],
    rules: {
      // Underscore-prefixed args/vars are an intentional "unused" marker (a callback that must accept a parameter it does not read).
      // `ignoreRestSiblings` allows `const { a, ...rest } = x` where `a` is dropped on purpose.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
)
