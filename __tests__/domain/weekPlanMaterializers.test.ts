import {
  materializeSetTargets,
  rowsAreSets,
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
        settings: { type: 'power', load: 'weight', restSec: 60, noHeavierAvailable: false },
      }),
    ).toEqual(setRows({ entry }));
  });

  test('interval: the cycle’s rounds with work and rest — no rest after the last one', () => {
    const settings = { ...HEAVY_BAG_CONFIG, rounds: 3 };

    expect(materializeSetTargets('interval', { entry, settings })).toEqual([
      { setNumber: 1, targetWorkSec: 120, targetRestSec: 45 },
      { setNumber: 2, targetWorkSec: 120, targetRestSec: 45 },
      { setNumber: 3, targetWorkSec: 120 },
    ]);
  });

  test('interval: one round has no rest at all (FR-6)', () => {
    expect(
      materializeSetTargets('interval', { entry, settings: { ...HEAVY_BAG_CONFIG, rounds: 1 } }),
    ).toEqual([{ setNumber: 1, targetWorkSec: 120 }]);
  });

  test('interval: rounds come from the settings, not from the day’s sets', () => {
    const rows = materializeSetTargets('interval', {
      entry: { ...entry, sets: 9 },
      settings: { ...HEAVY_BAG_CONFIG, rounds: 4 },
    });

    expect(rows).toHaveLength(4);
  });

  test('mobility: one block of the cycle’s length', () => {
    expect(
      materializeSetTargets('mobility', { entry, settings: { type: 'mobility', durationSec: 600 } }),
    ).toEqual([{ setNumber: 1, targetWorkSec: 600 }]);
  });

  test('interval and mobility without settings of their type fall back to rows by sets', () => {
    expect(materializeSetTargets('interval', { entry, settings: undefined })).toEqual(setRows({ entry }));
    expect(
      materializeSetTargets('mobility', { entry, settings: { ...HEAVY_BAG_CONFIG, rounds: 3 } }),
    ).toEqual(setRows({ entry }));
  });

  test('only strength and power rows are sets', () => {
    expect(rowsAreSets('strength')).toBe(true);
    expect(rowsAreSets('power')).toBe(true);
    expect(rowsAreSets('interval')).toBe(false);
    expect(rowsAreSets('mobility')).toBe(false);
  });
});
