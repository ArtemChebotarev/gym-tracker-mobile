import { GRID_STEP, REPS_STEP, WEIGHT_STEP, workoutCoachmarks } from '@components/WorkoutCoachmarksLogic';
import { InfoIcon } from '@design/icons/InfoIcon';
import type { WorkoutExercise, WorkoutSetRow } from '@usecases/workoutSession';

const NO_ACTIONS: WorkoutExercise['actions'] = {
  canReplace: false,
  canAddSet: false,
  canRemoveLastSet: false,
  canMoveUp: false,
  canMoveDown: false,
  canSkip: false,
  canUnskip: false,
  canDelete: false,
};

// A week-1 set: no target reps, no weight swap. Its card has the RIR badge and the Weight ⓘ.
const WEEK_1_ROW: WorkoutSetRow = { setNumber: 1, isFirstUnlogged: true };

function makeExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    sessionExerciseId: 'se-1',
    exerciseId: 'exercise-squat',
    name: 'Squat',
    muscleGroup: 'quads',
    equipment: 'barbell',
    targetRir: 3,
    status: 'planned',
    rows: [WEEK_1_ROW],
    plannedSetCount: 1,
    loggedSetCount: 0,
    hasLoggedSets: false,
    actions: NO_ACTIONS,
    ...overrides,
  };
}

const targets = (steps: ReturnType<typeof workoutCoachmarks>) => steps.map((step) => step.target);

describe('workoutCoachmarks', () => {
  test('the first card’s RIR badge and Weight ⓘ, and the grid button, in that order', () => {
    const steps = workoutCoachmarks({ exercise: makeExercise(), mode: 'live', isDeload: false });

    expect(targets(steps)).toEqual(['weight', 'rir', 'grid']);
  });

  test('with a Reps ⓘ too — its set has a weight swap — all four steps', () => {
    const exercise = makeExercise({
      rows: [
        {
          setNumber: 1,
          targetReps: 10,
          isFirstUnlogged: true,
          // Any swap makes the Reps ⓘ appear; its numbers don't matter to the tour.
          weightSwap: { unavailable: 'no_history' },
        },
      ],
    });

    const steps = workoutCoachmarks({ exercise, mode: 'live', isDeload: false });

    expect(targets(steps)).toEqual(['weight', 'reps', 'rir', 'grid']);
  });

  test('the words are the spec’s, and the RIR step’s are the badge popover’s', () => {
    const steps = workoutCoachmarks({ exercise: makeExercise(), mode: 'live', isDeload: false });

    expect(steps[1]).toMatchObject({ title: '3 RIR means 3 reps in reserve' });
    // The RIR step explains with the track and two theses; the others with a paragraph.
    expect(steps[1]?.explanation?.rows).toHaveLength(2);
    expect(steps[1]?.paragraphs).toBeUndefined();
    expect(steps[0]).toMatchObject(WEIGHT_STEP);
    expect(steps[steps.length - 1]).toMatchObject(GRID_STEP);
    expect(REPS_STEP.title).toBe('Want to change the weight?');
  });

  // The ⓘ character is a thin outline that cannot be made heavier: the line carries the real icon.
  test('the Weight and Reps steps point at the button by its own icon, not by the ⓘ character', () => {
    for (const step of [WEIGHT_STEP, REPS_STEP]) {
      const parts = step.paragraphs[0] as readonly (string | { strong: string } | { icon: unknown })[];

      expect(parts).toContainEqual({ icon: InfoIcon });
      expect(parts.filter((part) => typeof part === 'string').join('')).not.toContain('ⓘ');
    }
  });

  test('a pure bodyweight first card has no Weight ⓘ step — nothing to find', () => {
    const steps = workoutCoachmarks({
      exercise: makeExercise({ equipment: 'bodyweight' }),
      mode: 'live',
      isDeload: false,
    });

    expect(targets(steps)).toEqual(['rir', 'grid']);
  });

  test('a first card with no target RIR has no RIR step', () => {
    const steps = workoutCoachmarks({
      exercise: makeExercise({ targetRir: undefined }),
      mode: 'live',
      isDeload: false,
    });

    expect(targets(steps)).not.toContain('rir');
  });

  test('without any exercise, only the grid button is left', () => {
    expect(
      targets(workoutCoachmarks({ exercise: undefined, mode: 'live', isDeload: false })),
    ).toEqual(['grid']);
  });
});
