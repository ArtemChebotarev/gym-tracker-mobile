import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import {
  normalizeStoredMesocycle,
  withProgressionSettingsDefaults,
} from '@domain/mesocycleConverters';

// A snapshot saved before `historyLookbackDays` existed (task 083).
const legacyProgressionSettings = { minReps: 6, maxReps: 25, deloadRir: 8, deloadWeightFactor: 0.5 };

describe('withProgressionSettingsDefaults', () => {
  test('fills a missing historyLookbackDays with the default of 30', () => {
    expect(withProgressionSettingsDefaults(legacyProgressionSettings).historyLookbackDays).toBe(30);
  });

  test('keeps every field the stored snapshot does carry', () => {
    expect(withProgressionSettingsDefaults(legacyProgressionSettings)).toEqual({
      ...legacyProgressionSettings,
      historyLookbackDays: 30,
    });
  });

  test('keeps a stored historyLookbackDays that differs from the default', () => {
    const stored = { ...defaultProgressionSettings, historyLookbackDays: 45 };

    expect(withProgressionSettingsDefaults(stored)).toEqual(stored);
  });
});

describe('normalizeStoredMesocycle', () => {
  test('fills the progressionSettings snapshot and leaves the rest of the mesocycle as is', () => {
    const stored = {
      id: 'meso-legacy',
      name: 'Legacy block',
      lengthWeeks: 5,
      daysPerWeek: 3,
      status: 'planned',
      origin: { type: 'scratch' },
      progressionSettings: legacyProgressionSettings,
      createdAt: '2026-01-05T00:00:00.000Z',
    } as Mesocycle;

    expect(normalizeStoredMesocycle(stored)).toEqual({
      ...stored,
      progressionSettings: { ...legacyProgressionSettings, historyLookbackDays: 30 },
    });
  });
});
