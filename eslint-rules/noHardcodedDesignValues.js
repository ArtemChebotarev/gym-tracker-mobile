// Custom ESLint rule — see 08.0 · Design SDK, "Только токены": outside design/tokens.ts no code
// sets a color, a size, or an opacity itself; it references a token. Wired into eslint.config.js
// for app/**, components/**, design/components/** and design/icons/** — design/tokens.ts (which
// defines the tokens as literal values) and the non-UI helpers in design/*.ts are not covered.
//
// A literal is caught however it reaches a design property (task 100) — directly
// (`fontSize: 12`), through a local constant (`const SUBTITLE_FONT_SIZE = 12;` →
// `fontSize: SUBTITLE_FONT_SIZE`), through arithmetic on one (`borderRadius: DOT_SIZE / 2`), or as
// a component default (`{ size = 18 }`). An exported numeric constant is reported at its
// declaration too, since the file importing it can't see where the number came from. The only
// literal allowed is 0 — "none" is not a design value.
'use strict';

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FUNCTIONAL_COLOR_PATTERN = /^(?:rgba?|hsla?)\(/i;
const SIZE_STRING_PATTERN = /^-?\d+(?:\.\d+)?%?$/;

// Properties (style keys, and the component props that take a size) backed by a token table in
// design/tokens.ts. Ratios with no design meaning — `flex`, `flexGrow`, `zIndex` — and behavior
// constants (gesture thresholds, animation durations) are deliberately not listed.
const DESIGN_PROPERTY_NAMES = new Set([
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'flexBasis',
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
  'opacity',
  'shadowRadius',
  'shadowOpacity',
  'size',
  'hitSlop',
  'strokeWidth',
]);

// Component props that take a design value. Narrower than DESIGN_PROPERTY_NAMES on purpose: an
// icon's `<Rect width={16}>` is drawing geometry on its 24×24 grid, not a UI size.
const DESIGN_JSX_ATTRIBUTE_NAMES = new Set(['size', 'hitSlop', 'strokeWidth']);

function getStaticPropertyName(node) {
  if (node.key.type === 'Identifier' && !node.computed) return node.key.name;
  if (node.key.type === 'Literal' && typeof node.key.value === 'string') return node.key.value;
  return null;
}

function isHardcodedLiteral(node) {
  if (node.type !== 'Literal') return false;
  if (typeof node.value === 'number') return node.value !== 0;
  if (typeof node.value === 'string') return SIZE_STRING_PATTERN.test(node.value.trim());
  return false;
}

function findVariable(scope, name) {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name);
    if (variable) return variable;
  }
  return null;
}

/** The `const` initializer an identifier is bound to, or null (imports, params, lets, ...). */
function constInitializer(sourceCode, identifier) {
  const variable = findVariable(sourceCode.getScope(identifier), identifier.name);
  const definition = variable && variable.defs[0];
  if (
    !definition ||
    definition.type !== 'Variable' ||
    definition.parent.kind !== 'const' ||
    definition.node.id.type !== 'Identifier' ||
    !definition.node.init
  ) {
    return null;
  }
  return definition.node.init;
}

/**
 * The first hardcoded literal an expression evaluates from — itself, an operand, or (through a
 * local `const`) the constant's own initializer. Token references (`SPACING['space/row']`) are
 * member expressions and are never descended into.
 */
function findHardcodedLiteral(sourceCode, node, seen = new Set()) {
  if (!node) return null;
  switch (node.type) {
    case 'Literal':
      return isHardcodedLiteral(node) ? node : null;
    case 'UnaryExpression':
      return findHardcodedLiteral(sourceCode, node.argument, seen);
    case 'BinaryExpression':
    case 'LogicalExpression':
      return (
        findHardcodedLiteral(sourceCode, node.left, seen) ??
        findHardcodedLiteral(sourceCode, node.right, seen)
      );
    case 'ConditionalExpression':
      return (
        findHardcodedLiteral(sourceCode, node.consequent, seen) ??
        findHardcodedLiteral(sourceCode, node.alternate, seen)
      );
    case 'AssignmentPattern':
      return findHardcodedLiteral(sourceCode, node.right, seen);
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
      return findHardcodedLiteral(sourceCode, node.expression, seen);
    case 'Identifier': {
      if (seen.has(node.name)) return null;
      seen.add(node.name);
      const init = constInitializer(sourceCode, node);
      return init ? findHardcodedLiteral(sourceCode, init, seen) : null;
    }
    default:
      return null;
  }
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw colors, sizes and opacities outside design/tokens — see 08.0 · Design SDK, "Только токены".',
    },
    schema: [],
    messages: {
      hexColor:
        'Raw color "{{value}}" is not allowed here — import the matching token from design/tokens (see 08.0 · Design SDK).',
      numericSize:
        'Raw value for "{{property}}" is not allowed here, not even through a local constant — use a token from design/tokens, or add one there (see 08.0 · Design SDK).',
      exportedValue:
        'Exported design value "{{name}}" — define it as a token in design/tokens instead (see 08.0 · Design SDK).',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    function checkValue(propertyName, valueNode) {
      const literal = findHardcodedLiteral(sourceCode, valueNode);
      if (literal !== null) {
        context.report({
          node: valueNode,
          messageId: 'numericSize',
          data: { property: propertyName },
        });
      }
    }

    return {
      Literal(node) {
        if (
          typeof node.value === 'string' &&
          (HEX_COLOR_PATTERN.test(node.value) || FUNCTIONAL_COLOR_PATTERN.test(node.value))
        ) {
          context.report({ node, messageId: 'hexColor', data: { value: node.value } });
        }
      },
      Property(node) {
        const propertyName = getStaticPropertyName(node);
        if (propertyName === null || !DESIGN_PROPERTY_NAMES.has(propertyName)) return;
        checkValue(propertyName, node.value);
      },
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || !DESIGN_JSX_ATTRIBUTE_NAMES.has(node.name.name)) {
          return;
        }
        if (node.value && node.value.type === 'JSXExpressionContainer') {
          checkValue(node.name.name, node.value.expression);
        }
      },
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator'(node) {
        if (node.id.type !== 'Identifier' || !node.init) return;
        const init =
          node.init.type === 'TSAsExpression' || node.init.type === 'TSSatisfiesExpression'
            ? node.init.expression
            : node.init;
        if (findHardcodedLiteral(sourceCode, init) !== null) {
          context.report({ node, messageId: 'exportedValue', data: { name: node.id.name } });
        }
      },
    };
  },
};
