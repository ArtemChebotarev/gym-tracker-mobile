import { defaultProgressionSettings } from '@domain/mesocycle';
import { withProgressionSettingsDefaults } from '@domain/mesocycleConverters';
import type { SourceExercise } from '@domain/progression';
import { deloadGuideReps, deloadWeight, prescribeDeloadDay } from '@domain/progressionDeload';
import { powerDeloadWeight } from '@domain/progressionDeloadPower';
import { deloadWorkSec } from '@domain/progressionRoundsInterval';

// A value no rule could be hardcoding: everything below moves only if it reads the constant.
jest.mock('@domain/deloadLoad', () => ({ DELOAD_LOAD_FACTOR: 0.6 }));

const source: SourceExercise = {
  sessionExercise: {
    id: 'bench',
    exerciseId: 'exercise-bench',
    order: 1,
    setTargets: [{ setNumber: 1, targetReps: 10, suggestedWeight: 80 }],
  },
  muscleGroup: 'chest',
};

describe('DELOAD_LOAD_FACTOR is the one number behind every deload rule', () => {
  test('the strength weight follows it', () => {
    expect(deloadWeight(source.sessionExercise, [])).toBe(48);
  });

  test('the power weight in kilograms follows it', () => {
    expect(powerDeloadWeight({ ...source, powerLoad: 'weight' }, 1, [])).toBe(48);
  });

  test('the reps guide follows it where the body is the load', () => {
    expect(deloadGuideReps(10, 'bodyweight')).toBe(6);
  });

  test('an interval round’s work follows it, up to the time picker’s step', () => {
    expect(deloadWorkSec(120)).toBe(75);
  });
});

test('a snapshot saved with a deloadWeightFactor of its own no longer has a say', () => {
  const stored = { ...defaultProgressionSettings, deloadWeightFactor: 0.7 };

  const [day] = prescribeDeloadDay([source], [], withProgressionSettingsDefaults(stored));

  expect(day?.setTargets[0]?.suggestedWeight).toBe(48);
});
