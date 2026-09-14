import type {
  ColorToken,
  RadiusToken,
  SpacingToken,
  TypographyToken,
  TypographyValue,
} from '@design/tokens';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

const EXPECTED_COLOR_TOKENS = [
  'surface/page',
  'surface/raised',
  'surface/sheet',
  'surface/card',
  'surface/control-active',
  'border/default',
  'border/divider',
  'border/divider-subtle',
  'text/primary',
  'text/secondary',
  'text/muted',
  'text/faint',
  'text/disabled',
  'accent',
  'accent/on',
  'accent/bg',
  'accent/border',
  'danger',
  'danger/border',
];

const EXPECTED_TYPOGRAPHY_TOKENS = [
  'type/screen-title',
  'type/entity-title',
  'type/sheet-title',
  'type/subsection-title',
  'type/row-title',
  'type/body',
  'type/value',
  'type/label',
  'type/caption',
];

const EXPECTED_RADIUS_TOKENS = [
  'radius/pill',
  'radius/sheet',
  'radius/control',
  'radius/field',
  'radius/segment-inner',
];

const EXPECTED_SPACING_TOKENS = [
  'space/screen',
  'space/sheet',
  'space/section',
  'space/gap-tight',
  'space/gap',
  'space/row',
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

  test('only type/label carries letter-spacing and an uppercase transform', () => {
    expect(TYPOGRAPHY['type/label'].letterSpacing).toBe(0.04);
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
