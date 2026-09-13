// Custom ESLint rule for screen files — see the `code-style` skill, "Screens keep the same
// split, one level up": a screen component holds only JSX/rendering, its pure helper functions
// (formatters, derived values, predicates) live in a sibling `<ScreenName>Logic.ts` file. Wired
// into eslint.config.js for `app/**/*.tsx` and `components/**/*.tsx` only — deliberately not
// `.ts`, so the `Logic.ts` sibling files this rule exists to push helpers *into* aren't
// themselves flagged for containing exactly that.
//
// A top-level function is treated as the screen's own React component (exempt) when its name is
// PascalCase — the naming convention every component in this codebase already follows — and as
// a helper to extract (flagged) otherwise. Inline callbacks passed as props (`onPress={() =>
// ...}`, `renderItem={...}`) are anonymous and not declared at the top level, so this rule never
// touches them; only named, module-scoped declarations count.
'use strict';

function isComponentName(name) {
  return /^[A-Z]/.test(name);
}

function isTopLevel(node) {
  const { parent } = node;
  if (!parent) return false;
  if (parent.type === 'Program') return true;
  return (
    (parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportDefaultDeclaration') &&
    parent.parent != null &&
    parent.parent.type === 'Program'
  );
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow a top-level helper function in a screen file — move it to a sibling <ScreenName>Logic.ts file (see the code-style skill).',
    },
    schema: [],
    messages: {
      inlineLogic:
        'Helper function "{{name}}" must not be declared in a screen file — move it to a sibling <ScreenName>Logic.ts file (see the code-style skill).',
    },
  },
  create(context) {
    return {
      FunctionDeclaration(node) {
        if (!node.id || isComponentName(node.id.name) || !isTopLevel(node)) return;
        context.report({ node: node.id, messageId: 'inlineLogic', data: { name: node.id.name } });
      },
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || node.init == null) return;
        if (node.init.type !== 'ArrowFunctionExpression' && node.init.type !== 'FunctionExpression') {
          return;
        }
        if (isComponentName(node.id.name) || !isTopLevel(node.parent)) return;
        context.report({ node: node.id, messageId: 'inlineLogic', data: { name: node.id.name } });
      },
    };
  },
};
