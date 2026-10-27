import {
  materializeSetTargets,
  pricedFromHistory,
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

  test('interval: the cycle’s rounds, with no times — the cycle’s work and rest aren’t copied (GT-185)', () => {
    const settings = { ...HEAVY_BAG_CONFIG, rounds: 3 };

    expect(materializeSetTargets('interval', { entry, settings })).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
      { setNumber: 3 },
    ]);
  });

  test('interval: rounds come from the settings, not from the day’s sets', () => {
    const rows = materializeSetTargets('interval', {
      entry: { ...entry, sets: 9 },
      settings: { ...HEAVY_BAG_CONFIG, rounds: 4 },
    });

    expect(rows).toHaveLength(4);
  });

  test('mobility: one block, its length not copied from the cycle (GT-185)', () => {
    expect(
      materializeSetTargets('mobility', { entry, settings: { type: 'mobility', durationSec: 600 } }),
    ).toEqual([{ setNumber: 1 }]);
  });

  test('interval and mobility without settings of their type fall back to rows by sets', () => {
    expect(materializeSetTargets('interval', { entry, settings: undefined })).toEqual(setRows({ entry }));
    expect(
      materializeSetTargets('mobility', { entry, settings: { ...HEAVY_BAG_CONFIG, rounds: 3 } }),
    ).toEqual(setRows({ entry }));
  });

  test('history prices strength, power and interval rows at Start — not a mobility block yet (GT-185)', () => {
    expect(pricedFromHistory('strength')).toBe(true);
    expect(pricedFromHistory('power')).toBe(true);
    expect(pricedFromHistory('interval')).toBe(true);
    expect(pricedFromHistory('mobility')).toBe(false);
  });
});
