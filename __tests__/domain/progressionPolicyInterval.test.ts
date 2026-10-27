import type { RoundLog, SessionExercise, SetTarget } from '@domain/execution';
import type { SourceExercise } from '@domain/progression';
import { FULL_BODY } from '@domain/catalog';
import { INTERVAL_REST_MIN_SEC, INTERVAL_STEPS_SEC } from '@domain/exerciseConfig';
import { defaultProgressionSettings } from '@domain/mesocycle';
import {
  type IntervalProgression,
  stepIntervalLever as stepLever,
} from '@domain/progressionLeverInterval';
import { prescribeNextSession } from '@domain/progressionPlan';
import { intervalPolicy } from '@domain/progressionPolicyInterval';
import {
  allIntervalRoundsDone as allRoundsDone,
  referenceRounds,
  roundsFromReference,
} from '@domain/progressionRoundsInterval';
import { HEAVY_BAG_CONFIG } from '../fixtures/hybridExercises';
import { STAMPS } from '../fixtures/stamps';

const rounds: SetTarget[] = [
  { setNumber: 1, targetWorkSec: 120, targetRestSec: 60 },
  { setNumber: 2, targetWorkSec: 120, targetRestSec: 60 },
  { setNumber: 3, targetWorkSec: 120, targetRestSec: 60 },
];

describe('stepIntervalLever', () => {
  // GT-101: the levers' bounds (Artem, 26.10.2026). The rest stops at INTERVAL_REST_MIN_SEC; work
  // and rounds have no ceiling — a block's length already bounds how many steps it takes.
  test('the steps are 5 / 10 / 15 s, and the rest floor is 0:10', () => {
    expect(INTERVAL_STEPS_SEC).toEqual([5, 10, 15]);
    expect(INTERVAL_REST_MIN_SEC).toBe(10);
  });

  test('workTime and rounds have no ceiling', () => {
    const long = [{ setNumber: 12, targetWorkSec: 59 * 60 + 55, targetRestSec: 60 }];
    expect(stepLever(long, { lever: 'workTime', stepSec: 15 })[0]?.targetWorkSec).toBe(
      60 * 60 + 10,
    );
    expect(stepLever(long, { lever: 'rounds', stepSec: 15 }).map((r) => r.setNumber)).toEqual([
      12, 13,
    ]);
  });

  test('rest: every rest one step shorter', () => {
    expect(stepLever(rounds, { lever: 'rest', stepSec: 15 }).map((r) => r.targetRestSec)).toEqual([
      45, 45, 45,
    ]);
  });

  test('rest: never below 0:10, and a rest already under it is not raised', () => {
    const short = [
      { setNumber: 1, targetWorkSec: 20, targetRestSec: 15 },
      { setNumber: 2, targetWorkSec: 20, targetRestSec: 10 },
      { setNumber: 3, targetWorkSec: 20, targetRestSec: 5 },
    ];
    expect(stepLever(short, { lever: 'rest', stepSec: 10 }).map((r) => r.targetRestSec)).toEqual([
      10, 10, 5,
    ]);
  });

  test('workTime: every round’s work one step longer, the rest as it was', () => {
    expect(stepLever(rounds, { lever: 'workTime', stepSec: 5 })).toEqual([
      { setNumber: 1, targetWorkSec: 125, targetRestSec: 60 },
      { setNumber: 2, targetWorkSec: 125, targetRestSec: 60 },
      { setNumber: 3, targetWorkSec: 125, targetRestSec: 60 },
    ]);
  });

  test('rounds: one round more, a copy of the last; the step does not apply', () => {
    const edited = [...rounds.slice(0, 2), { setNumber: 3, targetWorkSec: 90, targetRestSec: 30 }];
    expect(stepLever(edited, { lever: 'rounds', stepSec: 15 })).toEqual([
      ...edited,
      { setNumber: 4, targetWorkSec: 90, targetRestSec: 30 },
    ]);
  });

  test('none: the plan as it is', () => {
    expect(stepLever(rounds, { lever: 'none', stepSec: 15 })).toEqual(rounds);
  });
});

describe('allIntervalRoundsDone', () => {
  const done = { completed: true };
  test('every planned round logged and completed', () => {
    expect(
      allRoundsDone(
        rounds,
        new Map([
          [1, done],
          [2, done],
          [3, done],
        ]),
      ),
    ).toBe(true);
  });
  test('a round not logged, or ended early, is not done', () => {
    expect(
      allRoundsDone(
        rounds,
        new Map([
          [1, done],
          [2, done],
        ]),
      ),
    ).toBe(false);
    expect(
      allRoundsDone(
        rounds,
        new Map([
          [1, done],
          [2, done],
          [3, { completed: false }],
        ]),
      ),
    ).toBe(false);
  });
  test('no rounds: none done', () => {
    expect(allRoundsDone([], new Map())).toBe(false);
  });
});

// The rule through the engine (10.1 FR-8): all rounds done → a lever step; otherwise the plan
// repeats.
describe('interval working week', () => {
  const bag: SessionExercise = {
    ...STAMPS,
    id: 'bag-w1',
    sessionId: 'session-w1',
    exerciseId: 'heavy-bag',
    order: 1,
    setTargets: rounds,
    targetRir: 3,
    status: 'completed',
  };

  function log(roundNumber: number, overrides: Partial<RoundLog> = {}): RoundLog {
    return {
      ...STAMPS,
      id: `round-${roundNumber}`,
      sessionExerciseId: bag.id,
      exerciseId: bag.exerciseId,
      roundNumber,
      workSec: 120,
      restSec: 60,
      restSkipped: false,
      completed: true,
      completedAt: '2026-09-01T09:30:00.000Z',
      ...overrides,
    };
  }

  function plan(
    roundLogs: RoundLog[],
    intervalProgression?: IntervalProgression,
    weekNumber = 2,
  ): SetTarget[] {
    const exercise: SourceExercise = {
      sessionExercise: bag,
      muscleGroup: FULL_BODY,
      type: 'interval',
      ...(intervalProgression ? { intervalProgression } : {}),
    };
    const [prescription] = prescribeNextSession({
      exercises: [exercise],
      logs: [],
      roundLogs,
      weekNumber,
      lengthWeeks: 5,
      settings: defaultProgressionSettings,
    });
    return prescription?.setTargets ?? [];
  }

  const allDone = [log(1), log(2), log(3)];

  test.each<[IntervalProgression, SetTarget[]]>([
    [{ lever: 'rest', stepSec: 15 }, rounds.map((round) => ({ ...round, targetRestSec: 45 }))],
    [{ lever: 'workTime', stepSec: 10 }, rounds.map((round) => ({ ...round, targetWorkSec: 130 }))],
    [
      { lever: 'rounds', stepSec: 15 },
      [...rounds, { setNumber: 4, targetWorkSec: 120, targetRestSec: 60 }],
    ],
    [{ lever: 'none', stepSec: 15 }, rounds],
  ])('all rounds done, lever %o: one step', (progression, expected) => {
    expect(plan(allDone, progression)).toEqual(expected);
  });

  test.each<IntervalProgression>([
    { lever: 'rest', stepSec: 15 },
    { lever: 'workTime', stepSec: 10 },
    { lever: 'rounds', stepSec: 15 },
  ])('a round ended early: the plan repeats, lever %o', (progression) => {
    expect(plan([log(1), log(2), log(3, { workSec: 70, completed: false })], progression)).toEqual(
      rounds,
    );
  });

  test('a round not logged: the plan repeats', () => {
    expect(plan([log(1), log(2)], { lever: 'rest', stepSec: 15 })).toEqual(rounds);
  });

  test('a skipped rest still counts the round done, and the step is from the planned rest', () => {
    expect(
      plan([log(1), log(2, { restSec: 3, restSkipped: true }), log(3)], {
        lever: 'rest',
        stepSec: 15,
      }),
    ).toEqual(rounds.map((round) => ({ ...round, targetRestSec: 45 })));
  });

  test('the step is from the structure as done: a rest changed in the workout', () => {
    expect(
      plan([log(1, { restSec: 50 }), log(2, { restSec: 50 }), log(3, { restSec: 50 })], {
        lever: 'rest',
        stepSec: 10,
      }).map((round) => round.targetRestSec),
    ).toEqual([40, 40, 40]);
  });

  test('no lever given: nothing to go by, the plan repeats', () => {
    expect(plan(allDone)).toEqual(rounds);
  });

  test('a deload day repeats the plan with no step, until the interval’s own deload (GT-105)', () => {
    expect(plan(allDone, { lever: 'rest', stepSec: 15 }, 5)).toEqual(rounds);
  });
});

describe('intervalPolicy', () => {
  test('reads its lever and step off the cycle’s settings', () => {
    expect(
      intervalPolicy.sourceFacts({ ...HEAVY_BAG_CONFIG, lever: 'workTime', stepSec: 5 }),
    ).toEqual({ intervalProgression: { lever: 'workTime', stepSec: 5 } });
    expect(intervalPolicy.sourceFacts(undefined)).toEqual({});
  });

  test('rule 6 and a copied block’s start with no reference: rounds with no times (GT-187)', () => {
    const input = {
      resolution: { kind: 'none' } as const,
      rowCount: 2,
      settings: defaultProgressionSettings,
    };
    const untimed = [{ setNumber: 1 }, { setNumber: 2 }];
    expect(intervalPolicy.prescribeFromReference({ ...input, weekRir: 2 })).toEqual(untimed);
    expect(intervalPolicy.prescribeBlockStart({ ...input, startRir: 3 })).toEqual(untimed);
  });
});

// GT-185 (10.1 FR-9): what a past performance of rounds hands to a slot that takes it as reference.
describe('rounds from a reference (GT-185)', () => {
  function log(roundNumber: number, overrides: Partial<RoundLog> = {}): RoundLog {
    return {
      ...STAMPS,
      id: `round-${roundNumber}`,
      sessionExerciseId: 'se-past',
      exerciseId: 'heavy-bag',
      roundNumber,
      workSec: 135,
      restSec: 30,
      restSkipped: false,
      completed: true,
      completedAt: '2026-09-10T08:00:00.000Z',
      ...overrides,
    };
  }

  test('each round as it ended: a skipped rest and a round ended early keep their plan', () => {
    expect(
      referenceRounds({
        roundTargets: rounds,
        roundLogs: [log(2, { workSec: 40, completed: false }), log(1, { restSkipped: true })],
      }),
    ).toEqual([
      { targetWorkSec: 135, targetRestSec: 60 },
      { targetWorkSec: 120, targetRestSec: 30 },
      // Not logged: as planned.
      { targetWorkSec: 120, targetRestSec: 60 },
    ]);
  });

  test('a round logged that its plan doesn’t have hands on its log', () => {
    expect(referenceRounds({ roundTargets: [], roundLogs: [log(1)] })).toEqual([
      { targetWorkSec: 135, targetRestSec: 30 },
    ]);
  });

  test('round N from round N; past the last, the last; no times, none', () => {
    const reference = [
      { targetWorkSec: 90, targetRestSec: 30 },
      { targetWorkSec: 95, targetRestSec: 25 },
    ];
    expect(roundsFromReference(reference, 3)).toEqual([
      { setNumber: 1, targetWorkSec: 90, targetRestSec: 30 },
      { setNumber: 2, targetWorkSec: 95, targetRestSec: 25 },
      { setNumber: 3, targetWorkSec: 95, targetRestSec: 25 },
    ]);
    expect(roundsFromReference(reference, 1)).toEqual([
      { setNumber: 1, targetWorkSec: 90, targetRestSec: 30 },
    ]);
    // A round with a time missing can't be one to copy.
    expect(roundsFromReference([{ targetWorkSec: 90 }], 2)).toEqual([
      { setNumber: 1 },
      { setNumber: 2 },
    ]);
  });

  test('the policy reads a target and an estimate alike, with no lever step', () => {
    const reference = {
      mesoId: 'meso',
      weekNumber: 1,
      dayNumber: 1,
      isDeload: false,
      targetRir: 2,
      performedAt: '2026-09-10T08:00:00.000Z',
      setLogs: [],
      roundLogs: [log(1), log(2)],
      roundTargets: rounds.slice(0, 2),
    };
    const input = { rowCount: 2, settings: defaultProgressionSettings };
    const expected = [
      { setNumber: 1, targetWorkSec: 135, targetRestSec: 30 },
      { setNumber: 2, targetWorkSec: 135, targetRestSec: 30 },
    ];
    expect(
      intervalPolicy.prescribeFromReference({
        ...input,
        resolution: { kind: 'target', reference },
        weekRir: 2,
      }),
    ).toEqual(expected);
    expect(
      intervalPolicy.prescribeBlockStart({
        ...input,
        resolution: { kind: 'estimate', reference, reason: 'other_slot', source: 'other_block' },
        startRir: 3,
      }),
    ).toEqual(expected);
  });
});
