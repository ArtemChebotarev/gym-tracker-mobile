import type {
  ColorToken,
  IconSizeToken,
  RadiusToken,
  SpacingToken,
  TypographyToken,
  TypographyValue,
} from '@design/tokens';
import {
  BORDER_WIDTHS,
  COLORS,
  ICON_SIZES,
  LINE_HEIGHTS,
  OPACITY,
  RADII,
  SHADOWS,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '@design/tokens';

const EXPECTED_COLOR_TOKENS = [
  'surface/page',
  'surface/raised',
  'surface/sheet',
  'surface/card',
  'surface/control-active',
  'surface/cell-done',
  'border/default',
  'border/divider',
  'border/divider-subtle',
  'border/cell-quiet',
  'text/primary',
  'text/secondary',
  'text/muted',
  'text/faint',
  'text/disabled',
  'text/on-light',
  'accent',
  'accent/on',
  'accent/bg',
  'accent/border',
  'danger',
  'danger/border',
  'overlay/scrim',
  'shadow',
];

const EXPECTED_TYPOGRAPHY_TOKENS = [
  'type/screen-title',
  'type/entity-title',
  'type/sheet-title',
  'type/card-title',
  'type/row-title',
  'type/body',
  'type/value',
  'type/meta',
  'type/set-value',
  'type/label',
  'type/caption',
];

const EXPECTED_RADIUS_TOKENS = [
  'radius/pill',
  'radius/sheet',
  'radius/control',
  'radius/field',
  'radius/segment-inner',
  'radius/small',
  'radius/progress',
];

const EXPECTED_SPACING_TOKENS = [
  'space/screen',
  'space/sheet',
  'space/section',
  'space/gap-tight',
  'space/gap',
  'space/row',
  'space/xxs',
  'space/chip-y',
  'space/set-row-y',
  'space/xs',
  'space/dots',
  'space/md',
  'space/action-row-y',
  'space/button',
  'space/pill-x',
  'space/xl',
];

function sorted(values: string[]): string[] {
  return [...values].sort();
}

function assertColorToken(token: ColorToken): ColorToken {
  return token;
}

function assertTypographyToken(token: TypographyToken): TypographyToken {
  return token;
}

function assertRadiusToken(token: RadiusToken): RadiusToken {
  return token;
}

function assertIconSizeToken(token: IconSizeToken): IconSizeToken {
  return token;
}

function assertSpacingToken(token: SpacingToken): SpacingToken {
  return token;
}

describe('design tokens', () => {
  test('COLORS exposes exactly the expected set of keys', () => {
    expect(sorted(Object.keys(COLORS))).toEqual(sorted(EXPECTED_COLOR_TOKENS));
  });

  test('TYPOGRAPHY exposes exactly the expected set of keys', () => {
    expect(sorted(Object.keys(TYPOGRAPHY))).toEqual(sorted(EXPECTED_TYPOGRAPHY_TOKENS));
  });

  test('RADII exposes exactly the expected set of keys', () => {
    expect(sorted(Object.keys(RADII))).toEqual(sorted(EXPECTED_RADIUS_TOKENS));
  });

  test('SPACING exposes exactly the expected set of keys', () => {
    expect(sorted(Object.keys(SPACING))).toEqual(sorted(EXPECTED_SPACING_TOKENS));
  });

  test('type/card-title is 17 / 500', () => {
    expect(TYPOGRAPHY['type/card-title']).toEqual({ fontSize: 17, fontWeight: '500' });
  });

  test('ICON_SIZES keeps the tab bar and IconButton sizes from 08.0', () => {
    expect(ICON_SIZES['icon/tab']).toBe(24);
    expect(ICON_SIZES['icon/button']).toBe(20);
  });

  // Task 100: every design value lives in a token group — each holds only its own kind of value.
  test('every size, border width, line height and spacing token is a positive number', () => {
    const numeric = { ...SPACING, ...RADII, ...ICON_SIZES, ...BORDER_WIDTHS, ...LINE_HEIGHTS };
    for (const [token, value] of Object.entries(numeric)) {
      expect([token, typeof value === 'number' && value > 0]).toEqual([token, true]);
    }
    for (const [token, value] of Object.entries(SIZES)) {
      const valid =
        (typeof value === 'number' && value > 0) ||
        (typeof value === 'string' && /^\d+%$/.test(value));
      expect([token, valid]).toEqual([token, true]);
    }
  });

  test('OPACITY tokens are fractions of full opacity', () => {
    for (const value of Object.values(OPACITY)) {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(1);
    }
  });

  test('the lifted shadow uses the shadow color token', () => {
    expect(SHADOWS['shadow/lifted'].shadowColor).toBe(COLORS.shadow);
  });

  test('IconSizeToken rejects an arbitrary string', () => {
    // @ts-expect-error - "icon/nonexistent" is not an IconSizeToken
    assertIconSizeToken('icon/nonexistent');
  });

  test('only type/label carries letter-spacing and an uppercase transform', () => {
    expect(TYPOGRAPHY['type/label'].letterSpacing).toBe(0.5);
    expect(TYPOGRAPHY['type/label'].textTransform).toBe('uppercase');

    const others = EXPECTED_TYPOGRAPHY_TOKENS.filter((token) => token !== 'type/label');
    for (const token of others) {
      const value = TYPOGRAPHY[token as TypographyToken] as TypographyValue;
      expect(value.letterSpacing).toBeUndefined();
      expect(value.textTransform).toBeUndefined();
    }
  });

  test('ColorToken rejects an arbitrary string', () => {
    // @ts-expect-error - "surface/nonexistent" is not a ColorToken
    assertColorToken('surface/nonexistent');
  });

  test('TypographyToken rejects an arbitrary string', () => {
    // @ts-expect-error - "type/nonexistent" is not a TypographyToken
    assertTypographyToken('type/nonexistent');
  });

  test('RadiusToken rejects an arbitrary string', () => {
    // @ts-expect-error - "radius/nonexistent" is not a RadiusToken
    assertRadiusToken('radius/nonexistent');
  });

  test('SpacingToken rejects an arbitrary string', () => {
    // @ts-expect-error - "space/nonexistent" is not a SpacingToken
    assertSpacingToken('space/nonexistent');
  });
});
