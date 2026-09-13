import { RuleTester } from 'eslint';

import rule from '../../eslint-rules/noInlineScreenLogic';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('no-inline-screen-logic', rule, {
  valid: [
    // The screen's own component, PascalCase, exported by name.
    `
      export function ExerciseLibraryScreen() {
        return null;
      }
    `,
    // The screen's own component, PascalCase, exported as default.
    `
      export default function LibraryScreen() {
        return null;
      }
    `,
    // A helper nested inside the component isn't module-scoped, so it's not this rule's concern.
    `
      function LibraryScreen() {
        function formatLabel(value) {
          return value;
        }
        return formatLabel('x');
      }
    `,
    // A plain (non-function) top-level constant, whatever its casing, isn't "logic" to extract.
    `const placeholder = 'Search exercises';`,
    // An inline callback passed as an argument is anonymous and not module-scoped.
    `registerHandler(() => doSomething());`,
  ],
  invalid: [
    {
      code: `
        function formatSubtitle(value) {
          return value;
        }
      `,
      errors: [{ messageId: 'inlineLogic', data: { name: 'formatSubtitle' } }],
    },
    {
      code: `
        export function hasActiveFilters(filters) {
          return Boolean(filters);
        }
      `,
      errors: [{ messageId: 'inlineLogic', data: { name: 'hasActiveFilters' } }],
    },
    {
      code: `const sourceLabel = (source) => source;`,
      errors: [{ messageId: 'inlineLogic', data: { name: 'sourceLabel' } }],
    },
    {
      code: `export const countEntries = (groups) => groups.length;`,
      errors: [{ messageId: 'inlineLogic', data: { name: 'countEntries' } }],
    },
  ],
});
