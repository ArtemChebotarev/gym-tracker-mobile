// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

// Layer boundary rules — see 07 · Persistence Layer Contract, "Layers" and rules 1 and 9.
// The dependency arrow always points inward: screens -> use cases -> domain -> repositories.
// Violation fixtures for these rules live in each layer's __boundary-fixtures__ folder and
// are checked by `npm run test:boundaries` (scripts/verify-boundaries.js).
const RN_AND_NAVIGATION_RESTRICTIONS = {
  paths: [
    {
      name: 'react-native',
      message: 'Must not depend on React Native — see 07 · Persistence Layer Contract, rule 9.',
    },
    {
      name: 'expo-router',
      message: 'Must not depend on navigation — see 07 · Persistence Layer Contract, rule 9.',
    },
  ],
  patterns: [
    {
      group: ['react-native/*'],
      message: 'Must not depend on React Native — see 07 · Persistence Layer Contract, rule 9.',
    },
    {
      group: ['expo-router/*', '@react-navigation/*'],
      message: 'Must not depend on navigation — see 07 · Persistence Layer Contract, rule 9.',
    },
  ],
};

const STORAGE_RESTRICTION = {
  group: ['@storage/*', '**/storage', '**/storage/*'],
  message:
    'Must not depend on storage/ directly — the dependency arrow points inward only, see 07 · Persistence Layer Contract, rule 1.',
};

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // domain/ is the portable core: no RN, no navigation, no storage, no screens.
    files: ['domain/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [...RN_AND_NAVIGATION_RESTRICTIONS.paths],
          patterns: [
            ...RN_AND_NAVIGATION_RESTRICTIONS.patterns,
            STORAGE_RESTRICTION,
            {
              group: ['@app/*', '**/app', '**/app/*'],
              message:
                'domain/ must not depend on app/ (screens) — the dependency arrow points inward only.',
            },
          ],
        },
      ],
    },
  },
  {
    // usecases/ orchestrates the domain and repositories, it has no storage or UI access.
    files: ['usecases/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [...RN_AND_NAVIGATION_RESTRICTIONS.paths],
          patterns: [...RN_AND_NAVIGATION_RESTRICTIONS.patterns, STORAGE_RESTRICTION],
        },
      ],
    },
  },
  {
    // app/ (screens) must go through usecases, never storage/ directly.
    files: ['app/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [STORAGE_RESTRICTION] }],
    },
  },
  {
    // Intentional violations used to test the rules above — see scripts/verify-boundaries.js.
    // Not part of the default `npm run lint` run (excluded via --ignore-pattern).
    files: ['**/__boundary-fixtures__/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
]);
