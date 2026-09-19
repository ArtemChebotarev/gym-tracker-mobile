import { RuleTester } from 'eslint';

import rule from '../../eslint-rules/noHardcodedDesignValues';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-hardcoded-design-values', rule, {
  valid: [
    // Token-based screen — reads colors and sizes from design/tokens, no literals of its own.
    `
      import { COLORS, RADII, SPACING } from '../../design/tokens';

      const styles = StyleSheet.create({
        card: {
          backgroundColor: COLORS['surface/card'],
          borderRadius: RADII['radius/field'],
          padding: SPACING['space/section'],
        },
      });
    `,
    // Ratios and non-style strings are not covered by this rule.
    `
      const styles = StyleSheet.create({
        container: {
          flex: 1,
          alignItems: 'center',
        },
      });
    `,
    // 0 means "none", not a design value.
    `const styles = StyleSheet.create({ row: { margin: 0, shadowOffset: { width: 0, height: 0 } } });`,
    // A local constant is fine as long as it's derived from tokens only.
    `
      import { OPACITY, SIZES, TYPOGRAPHY } from '../../design/tokens';
      const META = TYPOGRAPHY['type/meta'].fontSize;
      const styles = StyleSheet.create({
        text: { fontSize: META },
        dot: { width: SIZES['size/dot'] },
        pressed: { opacity: OPACITY['opacity/pressed'] },
      });
    `,
    // Behavior constants (gesture thresholds, durations, step counts) aren't design values.
    `
      const DISMISS_DISTANCE = 60;
      const TOTAL_STEPS = 3;
      if (dy > DISMISS_DISTANCE) close();
      const view = <Wizard totalSteps={TOTAL_STEPS} />;
    `,
    // An icon's drawing geometry on its 24×24 grid isn't a UI size.
    `const icon = <Rect x={4} y={5} width={16} height={15} rx={2.5} />;`,
    // A non-design export.
    `export const KG_TO_LB_LABEL = 'lb';`,
    // A hex-looking string outside of a color/size context is not what this rule targets.
    `const label = 'Not a color: #zzz';`,
  ],
  invalid: [
    {
      code: `
        const styles = StyleSheet.create({
          card: { backgroundColor: '#1A1C1F' },
        });
      `,
      errors: [{ messageId: 'hexColor' }],
    },
    {
      code: `const tint = '#17202D';`,
      errors: [{ messageId: 'hexColor' }],
    },
    {
      code: `
        const styles = StyleSheet.create({
          card: { padding: 14, borderRadius: 9 },
        });
      `,
      errors: [{ messageId: 'numericSize' }, { messageId: 'numericSize' }],
    },
    {
      code: `
        const inlineStyle = { top: -4 };
      `,
      errors: [{ messageId: 'numericSize' }],
    },
    {
      code: `
        const styles = StyleSheet.create({
          card: { backgroundColor: '#0E0F11', fontSize: 13 },
        });
      `,
      errors: [{ messageId: 'hexColor' }, { messageId: 'numericSize' }],
    },
    // Task 100: the loopholes the first version of this rule let through.
    {
      // A size routed through a local constant.
      code: `
        const SUBTITLE_FONT_SIZE = 12;
        const styles = StyleSheet.create({ subtitle: { fontSize: SUBTITLE_FONT_SIZE } });
      `,
      errors: [{ messageId: 'numericSize' }],
    },
    {
      // Through a chain of constants, and through arithmetic on one.
      code: `
        const DOT_SIZE = 6;
        const DOT_RADIUS = DOT_SIZE / 2;
        const styles = StyleSheet.create({
          dot: { width: DOT_SIZE, borderRadius: DOT_RADIUS },
          ring: { borderRadius: SIZE_TOKEN / 2 },
        });
      `,
      errors: [
        { messageId: 'numericSize' },
        { messageId: 'numericSize' },
        { messageId: 'numericSize' },
      ],
    },
    {
      // Opacity and shadow values are design values too.
      code: `
        const styles = StyleSheet.create({
          pressed: { opacity: 0.7 },
          lifted: { shadowOpacity: 0.3, shadowRadius: 8 },
        });
      `,
      errors: [
        { messageId: 'numericSize' },
        { messageId: 'numericSize' },
        { messageId: 'numericSize' },
      ],
    },
    {
      // A percentage size, directly or through a constant.
      code: `
        const MAX_SHEET_HEIGHT = '80%';
        const styles = StyleSheet.create({ sheet: { maxHeight: MAX_SHEET_HEIGHT, width: '50%' } });
      `,
      errors: [{ messageId: 'numericSize' }, { messageId: 'numericSize' }],
    },
    {
      // Size props on components, directly or through a constant.
      code: `
        const ICON_SIZE = 16;
        const a = <CheckIcon size={ICON_SIZE} />;
        const b = <Pressable hitSlop={8} />;
      `,
      errors: [{ messageId: 'numericSize' }, { messageId: 'numericSize' }],
    },
    {
      // A component's default size.
      code: `function Icon({ size = 18 }) { return size; }`,
      errors: [{ messageId: 'numericSize' }],
    },
    {
      // An exported number — the importing file can't see where it came from.
      code: `export const INDICATOR_WIDTH = 22;`,
      errors: [{ messageId: 'exportedValue' }],
    },
    {
      // Functional color notations, not just hex.
      code: `export const SCRIM = 'rgba(0, 0, 0, 0.5)';`,
      errors: [{ messageId: 'hexColor' }],
    },
  ],
});
