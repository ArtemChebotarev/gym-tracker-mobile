import { DELOAD_INTRO_FACTS } from '@components/DeloadIntroDialogLogic';
import { deloadExplanation } from '@components/RirExplanationLogic';
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

  test.each([
    [{ type: 'strength', equipment: 'barbell' }, '60% of your usual load'],
    [{ type: 'strength', equipment: 'bodyweight' }, '60% of the reps'],
    [{ type: 'strength', equipment: 'bodyweight-weighted' }, '60% of the added weight'],
    [{ type: 'power', powerLoad: 'weight' }, '60% of your usual load'],
    [{ type: 'power', powerLoad: 'none' }, '60% of the reps'],
    [{ type: 'power', powerLoad: 'level' }, '60% of the reps'],
    [{ type: 'interval' }, '60% of your usual work time'],
  ] as const)('the plate says it as a percent: %j', (input, strong) => {
    const [, load] = deloadExplanation(input).rows;

    expect(load?.text).toContainEqual({ strong });
  });

  test('the strength plate’s track follows it', () => {
    const { track } = deloadExplanation({ type: 'strength', equipment: 'barbell' });

    expect(track?.inner.max).toBe(60);
    expect(track?.marker).toBe(60);
    expect(track?.outer.max).toBe(100);
    expect(track?.labels[0]).toMatchObject({ value: 60, text: 'Stop here' });
  });

  test('the first-deload popup’s chip follows it', () => {
    expect(DELOAD_INTRO_FACTS[0]?.chip).toBe('60% load');
  });

  test('the added weight line says it twice, and no line says half', () => {
    const [, load] = deloadExplanation({ type: 'strength', equipment: 'bodyweight-weighted' }).rows;

    expect(load?.text).toContain(' and 60% of the reps, fewer sets.');
    expect(JSON.stringify(load?.text)).not.toMatch(/half/i);
  });
});

test('a snapshot saved with a deloadWeightFactor of its own no longer has a say', () => {
  const stored = { ...defaultProgressionSettings, deloadWeightFactor: 0.7 };

  const [day] = prescribeDeloadDay([source], [], withProgressionSettingsDefaults(stored));

  expect(day?.setTargets[0]?.suggestedWeight).toBe(48);
});
