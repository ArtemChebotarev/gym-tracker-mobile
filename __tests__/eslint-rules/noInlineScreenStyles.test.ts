import { RuleTester } from 'eslint';

import rule from '../../eslint-rules/noInlineScreenStyles';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('no-inline-screen-styles', rule, {
  valid: [
    // A screen importing its styles from a sibling file has no StyleSheet.create of its own.
    `
      import { styles } from './FooScreenStyles';
      function FooScreen() {
        return null;
      }
    `,
    // A same-named "create" on a different object is not what this rule targets.
    `const shape = Circle.create({ radius: 10 });`,
  ],
  invalid: [
    {
      code: `const styles = StyleSheet.create({ container: { flex: 1 } });`,
      errors: [{ messageId: 'inlineStyles' }],
    },
    {
      code: `export const styles = StyleSheet.create({});`,
      errors: [{ messageId: 'inlineStyles' }],
    },
    {
      code: `
        const headerStyles = StyleSheet.create({ title: {} });
        const bodyStyles = StyleSheet.create({ text: {} });
      `,
      errors: [{ messageId: 'inlineStyles' }, { messageId: 'inlineStyles' }],
    },
  ],
});
