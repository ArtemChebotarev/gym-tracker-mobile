import {
  GRID_STEP,
  hasFirstColumnInfo,
  INFO_STEP,
  NO_TOUR_STEPS_SEEN,
  RANGES_STEP,
  rangesCoachmarkIndex,
  tourScrollOffset,
  tourStepsSeen,
  workoutCoachmarks,
} from '@components/WorkoutCoachmarksLogic';
import { rirExplanation } from '@components/RirExplanationLogic';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { buildWeightSwap } from '@domain/weightSwapRules';
import { InfoIcon } from '@design/icons/InfoIcon';
import type {
  IntervalWorkoutExercise,
  MobilityWorkoutExercise,
  PowerWorkoutExercise,
  SetExerciseActions,
  StrengthWorkoutExercise,
  WorkoutExercise,
  WorkoutSetRow,
} from '@usecases/workoutSession';

const NO_ACTIONS: SetExerciseActions = {
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

function makeExercise(overrides: Partial<StrengthWorkoutExercise> = {}): StrengthWorkoutExercise {
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

function makePower(overrides: Partial<PowerWorkoutExercise> = {}): PowerWorkoutExercise {
  const { targetRir: _targetRir, ...strength } = makeExercise();
  return { ...strength, type: 'power', powerLoad: 'weight', ...overrides };
}

function makeInterval(overrides: Partial<IntervalWorkoutExercise> = {}): IntervalWorkoutExercise {
  const { targetRir: _targetRir, rows: _rows, ...strength } = makeExercise();
  return {
    ...strength,
    type: 'interval',
    rounds: [{ roundNumber: 1, isFirstUnlogged: true }],
    roundActions: { canAddRound: false, canRemoveLastRound: false },
    ...overrides,
  } as IntervalWorkoutExercise;
}

function makeMobility(): MobilityWorkoutExercise {
  const { targetRir: _targetRir, rows: _rows, ...strength } = makeExercise();
  return { ...strength, type: 'mobility' } as unknown as MobilityWorkoutExercise;
}

const tour = (exercises: readonly WorkoutExercise[], seen = NO_TOUR_STEPS_SEEN) =>
  workoutCoachmarks({ exercises, mode: 'live', isDeload: false, seen });

const targets = (steps: ReturnType<typeof workoutCoachmarks>) => steps.map((step) => step.target);

// Where each step landed: the target, and the card it found.
const places = (steps: ReturnType<typeof workoutCoachmarks>) =>
  steps.map((step) => [step.target, step.exerciseIndex]);

describe('workoutCoachmarks', () => {
  test('a day starting with strength: the ⓘ, the RIR badge, the grid button, in that order', () => {
    expect(places(tour([makeExercise()]))).toEqual([
      ['weight', 0],
      ['rir', 0],
      ['grid', undefined],
    ]);
  });

  test('a day starting with an interval: its ⓘ first, the RIR on the card that has one', () => {
    expect(places(tour([makeInterval(), makeExercise()]))).toEqual([
      ['weight', 0],
      ['rir', 1],
      ['grid', undefined],
    ]);
  });

  test('a day starting with mobility: each step finds the first card with its element', () => {
    expect(places(tour([makeMobility(), makeExercise()]))).toEqual([
      ['weight', 1],
      ['rir', 1],
      ['grid', undefined],
    ]);
  });

  test('steps may land on different cards', () => {
    const noInfo = makeExercise({ equipment: 'bodyweight' });

    expect(places(tour([noInfo, makeExercise()]))).toEqual([
      ['weight', 1],
      ['rir', 0],
      ['grid', undefined],
    ]);
  });

  test('power carries the ⓘ step and no RIR', () => {
    expect(targets(tour([makePower()]))).toEqual(['weight', 'grid']);
  });

  test('a day with no ⓘ and no RIR has only the grid button', () => {
    expect(targets(tour([makeMobility()]))).toEqual(['grid']);
    expect(targets(tour([makeExercise({ equipment: 'bodyweight', targetRir: undefined })]))).toEqual(
      ['grid'],
    );
  });

  test('a step already seen is left out, and the counter counts what is left', () => {
    const steps = tour([makeExercise()], { ...NO_TOUR_STEPS_SEEN, tourGridSeen: true });

    expect(targets(steps)).toEqual(['weight', 'rir']);
  });

  test('a step that waited comes up alone in the workout that has its element', () => {
    const seen = { ...NO_TOUR_STEPS_SEEN, tourRirSeen: true, tourGridSeen: true };

    expect(places(tour([makeMobility(), makeInterval()], seen))).toEqual([['weight', 1]]);
  });

  test('all seen, no steps', () => {
    const seen = { tourInfoSeen: true, tourRirSeen: true, tourGridSeen: true };

    expect(tour([makeExercise()], seen)).toEqual([]);
  });

  test('a weight swap on its set adds no step: the card still has its one ⓘ', () => {
    const exercise = makeExercise({
      rows: [
        {
          setNumber: 1,
          targetReps: 10,
          isFirstUnlogged: true,
          weightSwap: { unavailable: 'no_history' },
        },
      ],
    });

    expect(targets(tour([exercise]))).toEqual(['weight', 'rir', 'grid']);
  });

  test('the words are the spec’s, the same on every type', () => {
    expect(INFO_STEP.title).toBe('Not sure about the load?');
    expect(tour([makeInterval()])[0]).toMatchObject(INFO_STEP);
    expect(tour([makePower()])[0]).toMatchObject(INFO_STEP);
    expect(tour([makeExercise()])[0]).toMatchObject(INFO_STEP);
  });

  test('the RIR step’s words are the badge popover’s', () => {
    const steps = tour([makeExercise()]);

    expect(steps[1]).toMatchObject({ title: '3 RIR: stop 3 reps before failure' });
    // The RIR step explains with the track and two theses; the others with a paragraph.
    expect(steps[1]?.explanation).toEqual(rirExplanation({ targetRir: 3 }));
    expect(steps[1]?.paragraphs).toBeUndefined();
    expect(steps[steps.length - 1]).toMatchObject(GRID_STEP);
  });

  // The ⓘ character is a thin outline that cannot be made heavier: the line carries the real icon.
  test('the ⓘ step points at the button by its own icon, not by the ⓘ character', () => {
    const parts = INFO_STEP.paragraphs[0] as readonly (
      string | { strong: string } | { icon: unknown }
    )[];

    expect(parts).toContainEqual({ icon: InfoIcon });
    expect(parts.filter((part) => typeof part === 'string').join('')).not.toContain('ⓘ');
  });

  test('without any exercise, only the grid button is left', () => {
    expect(targets(tour([]))).toEqual(['grid']);
  });
});

describe('hasFirstColumnInfo', () => {
  test.each([
    ['weights', makeExercise(), true],
    ['a band', makeExercise({ equipment: 'resistance-band' }), true],
    ['bodyweight', makeExercise({ equipment: 'bodyweight' }), false],
    ['power', makePower(), true],
    ['power with no load', makePower({ powerLoad: 'none', loadEquipment: 'bodyweight' }), true],
    ['an interval with no time', makeInterval(), true],
    ['mobility', makeMobility(), false],
  ] as const)('%s', (_name, exercise, expected) => {
    expect(hasFirstColumnInfo(exercise, 'live', false)).toBe(expected);
  });

  test('an interval with times on a lever with no step has none', () => {
    const rounds = [{ roundNumber: 1, workSec: 60, restSec: 30, isFirstUnlogged: true }];

    expect(hasFirstColumnInfo(makeInterval({ rounds }), 'live', false)).toBe(false);
  });

  test('none on a deload, whatever the type', () => {
    for (const exercise of [makeExercise(), makePower(), makeInterval()]) {
      expect(hasFirstColumnInfo(exercise, 'live', true)).toBe(false);
    }
  });
});

describe('tourStepsSeen', () => {
  test('Got it writes down the steps that were shown, so the others wait', () => {
    expect(tourStepsSeen(tour([makeInterval()]), 'completed')).toEqual([
      'tourInfoSeen',
      'tourGridSeen',
    ]);
  });

  test('Skip ends all of it', () => {
    expect(tourStepsSeen(tour([makeExercise()]), 'skipped')).toEqual(['coachmarksSeen']);
  });
});

describe('tourScrollOffset', () => {
  const list = { y: 200, contentHeight: 2000, viewportHeight: 700, windowHeight: 1000 };

  test('an element standing well needs no scroll', () => {
    expect(tourScrollOffset({ ...list, targetY: 400 })).toBeUndefined();
  });

  test('one below brings it up to the upper part of the window', () => {
    expect(tourScrollOffset({ ...list, targetY: 1000 })).toBe(900);
  });

  test('one above brings it down, not past the top', () => {
    expect(tourScrollOffset({ ...list, targetY: 100 })).toBe(0);
  });

  test('never past the end of the list', () => {
    expect(tourScrollOffset({ ...list, y: 1000, targetY: 1500 })).toBe(1300);
  });

  test('a list already at its end stays', () => {
    expect(tourScrollOffset({ ...list, y: 1300, targetY: 900 })).toBeUndefined();
  });
});

// 08.11, "Коучмарк диапазонов веса".
describe('rangesCoachmarkIndex', () => {
  const rangesRow: WorkoutSetRow = {
    setNumber: 1,
    targetReps: 10,
    suggestedWeight: 15,
    isFirstUnlogged: true,
    weightSwap: buildWeightSwap({
      target: { targetReps: 10, suggestedWeight: 15 },
      settings: defaultProgressionSettings,
      isDeload: false,
      equipment: 'dumbbell',
    }),
  };
  const withRanges = makeExercise({ rows: [rangesRow] });
  const logged: WorkoutSetRow = {
    setNumber: 1,
    isFirstUnlogged: false,
    log: { weight: 15, reps: 10 },
  };

  test('the first card, when its ⓘ shows ranges', () => {
    expect(rangesCoachmarkIndex([withRanges], 'live', false)).toBe(0);
  });

  test('a card that is not first waits for its turn', () => {
    expect(rangesCoachmarkIndex([makeInterval(), withRanges], 'live', false)).toBeUndefined();
  });

  test('it comes up once the cards before it are done', () => {
    const done = makeExercise({ rows: [logged] });

    expect(rangesCoachmarkIndex([done, withRanges], 'live', false)).toBe(1);
  });

  test('a skipped card before it does not hold it back', () => {
    const skipped = makeExercise({ rows: [{ ...WEEK_1_ROW, isFirstUnlogged: false, notDone: 'skipped' }] });

    expect(rangesCoachmarkIndex([skipped, withRanges], 'live', false)).toBe(1);
  });

  test('a card with no history yet shows no ranges, so no coachmark', () => {
    expect(rangesCoachmarkIndex([makeExercise()], 'live', false)).toBeUndefined();
  });

  test('power has no ranges', () => {
    expect(rangesCoachmarkIndex([makePower({ rows: [rangesRow] })], 'live', false)).toBeUndefined();
  });

  test('not on a deload, and only in a live workout', () => {
    expect(rangesCoachmarkIndex([withRanges], 'live', true)).toBeUndefined();
    expect(rangesCoachmarkIndex([withRanges], 'readonly', false)).toBeUndefined();
  });

  test('nothing left to do, nothing to say', () => {
    expect(rangesCoachmarkIndex([makeExercise({ rows: [logged] })], 'live', false)).toBeUndefined();
    expect(rangesCoachmarkIndex([], 'live', false)).toBeUndefined();
  });

  test('the words are the spec’s', () => {
    expect(RANGES_STEP.title).toBe('Need a different weight?');
  });
});
