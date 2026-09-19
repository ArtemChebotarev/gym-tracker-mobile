// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const noHardcodedDesignValues = require('./eslint-rules/noHardcodedDesignValues');
const noInlineScreenStyles = require('./eslint-rules/noInlineScreenStyles');
const noInlineScreenLogic = require('./eslint-rules/noInlineScreenLogic');

// Layer boundary rules — see 07 · Persistence Layer Contract, "Layers" and rules 1 and 9.
// The dependency arrow always points inward: screens -> use cases -> domain -> repositories.
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
    // `.claude/worktrees/` holds other checkouts of this repo (parallel task sessions).
    ignores: ['dist/*', '.expo/*', '.claude/*'],
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
    // app/ (screens) and components/ (screen-level components kept out of app/ only because
    // Expo Router treats every file directly under app/ as a route — see components/README.md)
    // must go through usecases, never storage/ directly, and must never set a color or size
    // themselves — see 08.0 · Design SDK, "Только токены".
    files: ['app/**/*.{js,jsx,ts,tsx}', 'components/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      design: { rules: { 'no-hardcoded-design-values': noHardcodedDesignValues } },
    },
    rules: {
      'no-restricted-imports': ['error', { patterns: [STORAGE_RESTRICTION] }],
      'design/no-hardcoded-design-values': 'error',
    },
  },
  {
    // Screen components hold only JSX/rendering — see the `code-style` skill, "Screens keep the
    // same split, one level up". Scoped to `.tsx` only (not `.ts`), so the `Styles.ts`/`Logic.ts`
    // sibling files this pushes screens' styles/helpers *into* aren't flagged for containing
    // exactly that.
    files: ['app/**/*.tsx', 'components/**/*.tsx'],
    plugins: {
      codeStyle: {
        rules: {
          'no-inline-screen-styles': noInlineScreenStyles,
          'no-inline-screen-logic': noInlineScreenLogic,
        },
      },
    },
    rules: {
      'codeStyle/no-inline-screen-styles': 'error',
      'codeStyle/no-inline-screen-logic': 'error',
    },
  },
]);
