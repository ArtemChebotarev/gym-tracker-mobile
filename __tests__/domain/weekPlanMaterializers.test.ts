import {
  materializeSetTargets,
  setRows,
} from '@domain/weekPlanMaterializers';
import { HEAVY_BAG_CONFIG } from '../fixtures/hybridExercises';

const entry = { exerciseId: 'x', order: 1, sets: 2 };

describe('weekPlanMaterializers (GT-160)', () => {
  test('strength and power: one bare row per set of the day', () => {
    expect(materializeSetTargets('strength', { entry, settings: undefined })).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
    ]);
    expect(
      materializeSetTargets('power', {
        entry,
        settings: { type: 'power', load: 'weight', noHeavierAvailable: false },
      }),
    ).toEqual(setRows({ entry }));
  });

  test('interval: one round per the day’s sets, with no times (GT-185, GT-190)', () => {
    expect(
      materializeSetTargets('interval', { entry: { ...entry, sets: 3 }, settings: HEAVY_BAG_CONFIG }),
    ).toEqual([{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }]);
  });

  test('interval: a copy stored with `rounds` before GT-190 doesn’t decide the count', () => {
    const legacy = { ...HEAVY_BAG_CONFIG, rounds: 4 } as typeof HEAVY_BAG_CONFIG;

    expect(materializeSetTargets('interval', { entry: { ...entry, sets: 2 }, settings: legacy })).toHaveLength(2);
  });

  test('mobility: one block, its length not copied from the cycle (GT-185)', () => {
    expect(
      materializeSetTargets('mobility', { entry, settings: { type: 'mobility' } }),
    ).toEqual([{ setNumber: 1 }]);
  });

  test('interval and mobility without settings of their type fall back to rows by sets', () => {
    expect(materializeSetTargets('interval', { entry, settings: undefined })).toEqual(setRows({ entry }));
    expect(materializeSetTargets('mobility', { entry, settings: HEAVY_BAG_CONFIG })).toEqual(
      setRows({ entry }),
    );
  });
});
