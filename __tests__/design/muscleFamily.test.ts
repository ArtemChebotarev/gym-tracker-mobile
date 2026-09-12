import { MUSCLE_GROUPS } from '@domain/catalog';
import {
  getFamilyColor,
  getFamilyTextOnTint,
  getFamilyTint,
  getMuscleFamily,
  MUSCLE_FAMILIES,
} from '@design/muscleFamily';

const EXPECTED_FAMILY_BY_GROUP = {
  chest: 'push',
  shoulders: 'push',
  triceps: 'push',
  back: 'pull',
  biceps: 'pull',
  forearms: 'pull',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  abs: 'core',
  traps: 'core',
} as const;

describe('getMuscleFamily', () => {
  test('maps every one of the twelve muscle groups to a family', () => {
    for (const group of MUSCLE_GROUPS) {
      expect(getMuscleFamily(group)).toBe(EXPECTED_FAMILY_BY_GROUP[group]);
    }
  });

  test('covers all twelve groups with no gaps', () => {
    expect(Object.keys(EXPECTED_FAMILY_BY_GROUP).sort()).toEqual([...MUSCLE_GROUPS].sort());
  });

  test('an unknown id does not crash the app — it resolves to undefined', () => {
    expect(() => getMuscleFamily('not-a-real-muscle-group')).not.toThrow();
    expect(getMuscleFamily('not-a-real-muscle-group')).toBeUndefined();
    expect(getMuscleFamily('')).toBeUndefined();
  });
});

describe('getFamilyColor', () => {
  test('returns the spec color for each family', () => {
    expect(getFamilyColor('push')).toBe('#F0A537');
    expect(getFamilyColor('pull')).toBe('#5B9CF8');
    expect(getFamilyColor('legs')).toBe('#35C2A0');
    expect(getFamilyColor('core')).toBe('#A78BFA');
  });
});

describe('getFamilyTint', () => {
  // Derived by rule (12% alpha blend of the family color over `surface/page`), not
  // hand-picked — see 08.0 · Design SDK, "Цвета групп мышц".
  test('tint for pull matches the (corrected) example from the spec', () => {
    expect(getFamilyTint('pull')).toBe('#17202D');
  });

  test('every family produces a distinct, well-formed hex tint', () => {
    const tints = MUSCLE_FAMILIES.map((family) => getFamilyTint(family));
    expect(tints).toEqual(['#292116', '#17202D', '#132422', '#201E2D']);
    expect(new Set(tints).size).toBe(MUSCLE_FAMILIES.length);
    for (const tint of tints) {
      expect(tint).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe('getFamilyTextOnTint', () => {
  // Derived by rule (lightened to a fixed target lightness, same hue and saturation as the
  // family color), not hand-picked.
  test('text-on-tint for pull matches the (corrected) example from the spec', () => {
    expect(getFamilyTextOnTint('pull')).toBe('#93BEFA');
  });

  test('every family produces a distinct, well-formed hex text-on-tint', () => {
    const textOnTints = MUSCLE_FAMILIES.map((family) => getFamilyTextOnTint(family));
    expect(textOnTints).toEqual(['#F7D097', '#93BEFA', '#A7E7D7', '#AD93FA']);
    expect(new Set(textOnTints).size).toBe(MUSCLE_FAMILIES.length);
    for (const textOnTint of textOnTints) {
      expect(textOnTint).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
