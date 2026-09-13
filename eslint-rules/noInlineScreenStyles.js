// Custom ESLint rule for screen files — see the `code-style` skill, "Screens keep the same
// split, one level up": a screen component holds only JSX/rendering, its StyleSheet lives in a
// sibling `<ScreenName>Styles.ts` file. Wired into eslint.config.js for `app/**/*.tsx` and
// `components/**/*.tsx` only — deliberately not `.ts`, so the `Styles.ts` sibling files this
// rule exists to push styles *into* aren't themselves flagged for containing exactly that.
'use strict';

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow StyleSheet.create(...) in a screen file — move it to a sibling <ScreenName>Styles.ts file (see the code-style skill).',
    },
    schema: [],
    messages: {
      inlineStyles:
        'StyleSheet.create(...) must not appear in a screen file — move it to a sibling <ScreenName>Styles.ts file (see the code-style skill).',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const { callee } = node;
        if (
          callee.type === 'MemberExpression' &&
          !callee.computed &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'StyleSheet' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'create'
        ) {
          context.report({ node: callee, messageId: 'inlineStyles' });
        }
      },
    };
  },
};
