import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

// Flat ESLint config for a TypeScript library (no Vue SFCs): typescript-eslint's recommended rules.
export default defineConfig(
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
      // Underscore-prefixed args/vars are an intentional "unused" marker.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
)
