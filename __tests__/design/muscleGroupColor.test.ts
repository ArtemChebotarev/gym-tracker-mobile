import { MUSCLE_GROUPS } from '@domain/catalog';
import {
  getCategoryColor,
  getCategoryTextOnTint,
  getCategoryTint,
  getMuscleGroupCategory,
  getMuscleGroupChipColors,
  MUSCLE_GROUP_COLOR_CATEGORIES,
} from '@design/muscleGroupColor';

const EXPECTED_CATEGORY_BY_GROUP = {
  chest: 'chest',
  back: 'back',
  traps: 'back',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  shoulders: 'shoulders',
  abs: 'abs',
} as const;

describe('getMuscleGroupCategory', () => {
  test('maps every one of the twelve muscle groups to a color category', () => {
    for (const group of MUSCLE_GROUPS) {
      expect(getMuscleGroupCategory(group)).toBe(EXPECTED_CATEGORY_BY_GROUP[group]);
    }
  });

  test('covers all twelve groups with no gaps', () => {
    expect(Object.keys(EXPECTED_CATEGORY_BY_GROUP).sort()).toEqual([...MUSCLE_GROUPS].sort());
  });

  test('an unknown id does not crash the app — it resolves to undefined', () => {
    expect(() => getMuscleGroupCategory('not-a-real-muscle-group')).not.toThrow();
    expect(getMuscleGroupCategory('not-a-real-muscle-group')).toBeUndefined();
    expect(getMuscleGroupCategory('')).toBeUndefined();
  });
});

describe('getCategoryColor', () => {
  test('returns the spec color for each category', () => {
    expect(getCategoryColor('chest')).toBe('#F0A537');
    expect(getCategoryColor('back')).toBe('#5B9CF8');
    expect(getCategoryColor('arms')).toBe('#F25ACE');
    expect(getCategoryColor('legs')).toBe('#35C2A0');
    expect(getCategoryColor('shoulders')).toBe('#5AF25F');
    expect(getCategoryColor('abs')).toBe('#A78BFA');
  });
});

describe('getCategoryTint', () => {
  // Derived by rule (12% alpha blend of the category color over `surface/page`), not
  // hand-picked — see 08.0 · Design SDK, "Цвета групп мышц".
  test('tint for back matches the example from the spec', () => {
    expect(getCategoryTint('back')).toBe('#17202D');
  });

  test('every category produces a distinct, well-formed hex tint', () => {
    const tints = MUSCLE_GROUP_COLOR_CATEGORIES.map((category) => getCategoryTint(category));
    expect(tints).toEqual(['#292116', '#17202D', '#291828', '#132422', '#172A1A', '#201E2D']);
    expect(new Set(tints).size).toBe(MUSCLE_GROUP_COLOR_CATEGORIES.length);
    for (const tint of tints) {
      expect(tint).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe('getCategoryTextOnTint', () => {
  // Derived by rule (lightened to a fixed target lightness, same hue and saturation as the
  // category color), not hand-picked.
  test('text-on-tint for back matches the example from the spec', () => {
    expect(getCategoryTextOnTint('back')).toBe('#93BEFA');
  });

  test('every category produces a distinct, well-formed hex text-on-tint', () => {
    const textOnTints = MUSCLE_GROUP_COLOR_CATEGORIES.map((category) =>
      getCategoryTextOnTint(category),
    );
    expect(textOnTints).toEqual(['#F7D097', '#93BEFA', '#F797E0', '#A7E7D7', '#97F79A', '#AD93FA']);
    expect(new Set(textOnTints).size).toBe(MUSCLE_GROUP_COLOR_CATEGORIES.length);
    for (const textOnTint of textOnTints) {
      expect(textOnTint).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe('getMuscleGroupChipColors', () => {
  test('resolves the dot and border to the raw category color, for a known muscle group', () => {
    expect(getMuscleGroupChipColors('chest').dot).toBe(getCategoryColor('chest'));
    expect(getMuscleGroupChipColors('chest').border).toBe(getCategoryColor('chest'));
  });

  test('resolves the tint and text colors from the same category', () => {
    expect(getMuscleGroupChipColors('back').tint).toBe(getCategoryTint('back'));
    expect(getMuscleGroupChipColors('back').text).toBe(getCategoryTextOnTint('back'));
  });

  test('groups sharing a family resolve to the same colors (traps shares "back" with back)', () => {
    expect(getMuscleGroupChipColors('traps')).toEqual(getMuscleGroupChipColors('back'));
  });
});
