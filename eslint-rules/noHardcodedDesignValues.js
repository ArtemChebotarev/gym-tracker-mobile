// Custom ESLint rule for screen files — see 08.0 · Design SDK, "Только токены": a screen must
// never set a color or a size itself, only reference a token from design/. Wired into
// eslint.config.js for the `app/**` file glob only, so design/ (which defines the tokens as
// literal hex values and numbers) is unaffected.
'use strict';

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

// Style property names backed by a token table in 08.0 (radii, spacing, typography, border
// widths). Ratios such as `flex` or `opacity` are deliberately excluded — they have no token
// table to point at.
const SIZE_PROPERTY_NAMES = new Set([
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'top',
  'bottom',
  'left',
  'right',
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingHorizontal',
  'paddingVertical',
  'paddingStart',
  'paddingEnd',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'gap',
  'rowGap',
  'columnGap',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderWidth',
  'borderTopWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRightWidth',
  'fontSize',
  'lineHeight',
  'letterSpacing',
]);

function getStaticPropertyName(node) {
  if (node.key.type === 'Identifier' && !node.computed) return node.key.name;
  if (node.key.type === 'Literal' && typeof node.key.value === 'string') return node.key.value;
  return null;
}

function getNumericLiteral(node) {
  if (node.type === 'Literal' && typeof node.value === 'number') return node;
  if (
    node.type === 'UnaryExpression' &&
    node.operator === '-' &&
    node.argument.type === 'Literal' &&
    typeof node.argument.value === 'number'
  ) {
    return node;
  }
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw hex colors and raw numeric size values in screen files — see 08.0 · Design SDK, "Только токены".',
    },
    schema: [],
    messages: {
      hexColor:
        'Raw hex color "{{value}}" is not allowed here — import the matching token from design/tokens (see 08.0 · Design SDK).',
      numericSize:
        'Raw numeric value for "{{property}}" is not allowed here — import the matching token from design/tokens (see 08.0 · Design SDK).',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'string' && HEX_COLOR_PATTERN.test(node.value)) {
          context.report({ node, messageId: 'hexColor', data: { value: node.value } });
        }
      },
      Property(node) {
        const propertyName = getStaticPropertyName(node);
        if (propertyName === null || !SIZE_PROPERTY_NAMES.has(propertyName)) return;

        const numericLiteral = getNumericLiteral(node.value);
        if (numericLiteral !== null) {
          context.report({
            node: numericLiteral,
            messageId: 'numericSize',
            data: { property: propertyName },
          });
        }
      },
    };
  },
};
