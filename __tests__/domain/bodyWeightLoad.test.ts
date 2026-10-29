import {
  isBodyWeightExercise,
  isPureBodyWeight,
  loadEquipmentOf,
  usesAddedWeight,
} from '@domain/bodyWeightLoad';

describe('telling the bodyweight exercises apart', () => {
  test('both kinds are bodyweight exercises — the block weight applies to both', () => {
    expect(isBodyWeightExercise('bodyweight')).toBe(true);
    expect(isBodyWeightExercise('bodyweight-weighted')).toBe(true);
  });

  test('nothing else is', () => {
    expect(isBodyWeightExercise('barbell')).toBe(false);
    expect(isBodyWeightExercise(undefined)).toBe(false);
  });

  test('only the pure kind has no weight to progress', () => {
    expect(isPureBodyWeight('bodyweight')).toBe(true);
    expect(isPureBodyWeight('bodyweight-weighted')).toBe(false);
    expect(isPureBodyWeight('dumbbell')).toBe(false);
    expect(isPureBodyWeight(undefined)).toBe(false);
  });

  test('only the weighted kind reads `weight` as added weight', () => {
    expect(usesAddedWeight('bodyweight-weighted')).toBe(true);
    expect(usesAddedWeight('bodyweight')).toBe(false);
    expect(usesAddedWeight('machine')).toBe(false);
  });

  test('a resistance band is a pure bodyweight exercise: the block weight shows, nothing to progress', () => {
    expect(isBodyWeightExercise('resistance-band')).toBe(true);
    expect(isPureBodyWeight('resistance-band')).toBe(true);
    expect(usesAddedWeight('resistance-band')).toBe(false);
  });
});

// GT-83: a power exercise that is its own load weighs what you weigh, whatever it is done on.
describe('loadEquipmentOf', () => {
  const power = (load: 'weight' | 'level' | 'none') =>
    ({ type: 'power', load, restSec: 60, noHeavierAvailable: false }) as const;

  test('a power exercise whose load is none loads like a bodyweight one, on any equipment', () => {
    expect(loadEquipmentOf({ equipment: 'plyo-box', config: power('none') })).toBe('bodyweight');
    expect(loadEquipmentOf({ config: power('none') })).toBe('bodyweight');
    expect(
      isPureBodyWeight(loadEquipmentOf({ equipment: 'plyo-box', config: power('none') })),
    ).toBe(true);
  });

  test('every other exercise keeps its own equipment', () => {
    expect(loadEquipmentOf({ equipment: 'plyo-box', config: power('level') })).toBe('plyo-box');
    expect(loadEquipmentOf({ equipment: 'medicine-ball', config: power('weight') })).toBe(
      'medicine-ball',
    );
    expect(loadEquipmentOf({ equipment: 'barbell' })).toBe('barbell');
    expect(loadEquipmentOf({})).toBeUndefined();
  });
});
