import type { PowerLoad } from '@domain/exerciseConfig';
import { POWER_MAX_SETS, powerCeilingHint } from '@domain/powerCeilingHint';

const top = { weightHint: 'increase' } as const;
const growing = {};

function hint(load: PowerLoad, sets: number, noHeavierAvailable = false) {
  return powerCeilingHint({
    load,
    noHeavierAvailable,
    setTargets: Array.from({ length: sets }, () => top),
  });
}

describe('powerCeilingHint (10.2 P6–P9)', () => {
  test('nothing to say while any set still grows, and with no sets at all', () => {
    expect(
      powerCeilingHint({
        load: 'weight',
        noHeavierAvailable: false,
        setTargets: [top, growing, top],
      }),
    ).toBeUndefined();
    expect(
      powerCeilingHint({ load: 'weight', noHeavierAvailable: false, setTargets: [] }),
    ).toBeUndefined();
  });

  test('kilograms: heavier or one more set', () => {
    expect(hint('weight', 3)).toEqual({ options: ['heavier', 'add-set'], canFlagNoHeavier: true });
  });

  test('a level: a higher level or one more set, the same as kilograms', () => {
    expect(hint('level', 3)).toEqual({
      options: ['higher-level', 'add-set'],
      canFlagNoHeavier: true,
    });
  });

  test('its own load: only one more set, and no flag to set', () => {
    expect(hint('none', 3)).toEqual({ options: ['add-set'], canFlagNoHeavier: false });
  });

  test('at the set cap only the load is left; its own load has nothing and the progression stops', () => {
    expect(POWER_MAX_SETS).toBe(4);
    expect(hint('weight', 4)).toEqual({ options: ['heavier'], canFlagNoHeavier: true });
    expect(hint('level', 4)).toEqual({ options: ['higher-level'], canFlagNoHeavier: true });
    expect(hint('none', 4)).toBeUndefined();
  });

  test('"No heavier available" swaps the load option for a harder variation', () => {
    expect(hint('weight', 3, true)).toEqual({
      options: ['harder-variation', 'add-set'],
      canFlagNoHeavier: false,
    });
    expect(hint('level', 4, true)).toEqual({
      options: ['harder-variation'],
      canFlagNoHeavier: false,
    });
  });
});
