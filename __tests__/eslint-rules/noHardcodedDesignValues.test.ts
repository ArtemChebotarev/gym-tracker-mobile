import { RuleTester } from 'eslint';

import rule from '../../eslint-rules/noHardcodedDesignValues';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
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
          opacity: 0.5,
          alignItems: 'center',
        },
      });
    `,
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
  ],
});
