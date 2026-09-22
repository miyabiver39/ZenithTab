import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * Flat config. Type-aware rules are deliberately off: `tsc --noEmit`
 * already runs in CI, and keeping lint fast keeps it in the loop.
 * The react-hooks rules are the point of this setup — a missing
 * dependency or a conditional hook is caught here, not in production.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'release/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', '.agents/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, chrome: 'readonly' },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'error',
      // React-Compiler-era rule that flags the common "kick off a fetch in
      // an effect, set loading state" pattern this codebase uses in its
      // data hooks and widgets. Those are intentional and behave correctly;
      // rewriting them is a separate refactor, so the rule is off here.
      'react-hooks/set-state-in-effect': 'off',
      // Widget configs are intentionally loose records; the registry and
      // storage layers deal in `Record<string, any>` on purpose.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
  {
    // Test files use `any` casts and empty mocks freely.
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    files: ['scripts/**/*.{js,mjs}', '*.config.{js,ts}', 'playwright.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  }
);
