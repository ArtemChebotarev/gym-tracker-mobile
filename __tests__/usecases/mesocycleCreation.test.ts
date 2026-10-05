import { isNotFoundError } from '@domain/errors';
import type { Session, SessionExercise } from '@domain/execution';
import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { MesoTemplate, WeekPlan } from '@domain/plan';
import type { Incoming, Unsaved } from '@domain/timestamps';
import { toTemplateMesoBuilderDraft, toTemplateMesocycleConfirmInput } from '@state/draftStore';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { SqliteSessionRepository } from '@storage/sqlite/session';
import { SqliteSessionExerciseRepository } from '@storage/sqlite/sessionExercise';
import { createSqliteMesocycleStartStore } from '@storage/sqlite/mesocycleStartStore';
import { SqliteSettingsRepository } from '@storage/sqlite/settings';
import { SqliteTemplateRepository } from '@storage/sqlite/template';
import {
  confirmCopyWeekMesocycleDraft,
  confirmScratchMesocycleDraft,
  confirmTemplateMesocycleDraft,
  extractSourceWeekPlan,
  listSourceWeeks,
  prepareTemplateDraft,
} from '@usecases/mesocycleCreation';
import { startMesocycle } from '@usecases/mesocycleStart';
import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const twoDayWeekPlan: WeekPlan = {
  days: [
    {
      dayNumber: 1,
      name: '',
      exercises: [{ exerciseId: 'exercise-bench-press', order: 1, sets: 3 }],
    },
    { dayNumber: 2, name: '', exercises: [{ exerciseId: 'exercise-squat', order: 1, sets: 4 }] },
  ],
};

function makeDeps() {
  const store = db();
  return {
    mesocycleRepo: new SqliteMesocycleRepository(store),
    sessionRepo: new SqliteSessionRepository(store),
    sessionExerciseRepo: new SqliteSessionExerciseRepository(store),
    settingsRepo: new SqliteSettingsRepository(db()),
  };
}

const draftInput = {
  name: 'Push/Pull/Legs',
  lengthWeeks: 6,
  daysPerWeek: 2,
  weekPlan: twoDayWeekPlan,
};

describe('confirmScratchMesocycleDraft', () => {
  test('saves a planned mesocycle with the correct origin and no startDate', async () => {
    const deps = makeDeps();

    const saved = await confirmScratchMesocycleDraft(
      { name: 'Push/Pull/Legs', lengthWeeks: 6, daysPerWeek: 2, weekPlan: twoDayWeekPlan },
      deps,
    );

    expect(saved.status).toBe('planned');
    expect(saved.startDate).toBeUndefined();
    expect(saved.origin).toEqual({ type: 'scratch' });
    await expect(deps.mesocycleRepo.getById(saved.id)).resolves.toEqual(saved);
  });

  test('creates no Session for the confirmed mesocycle', async () => {
    const deps = makeDeps();

    const saved = await confirmScratchMesocycleDraft(
      { name: 'Push/Pull/Legs', lengthWeeks: 6, daysPerWeek: 2, weekPlan: twoDayWeekPlan },
      deps,
    );

    await expect(deps.sessionRepo.listByMesoId(saved.id)).resolves.toEqual([]);
  });

  test('confirming the same draft input twice creates two independent records, not an update', async () => {
    const deps = makeDeps();
    const input = {
      name: 'Push/Pull/Legs',
      lengthWeeks: 6,
      daysPerWeek: 2,
      weekPlan: twoDayWeekPlan,
    };

    const first = await confirmScratchMesocycleDraft(input, deps);
    const second = await confirmScratchMesocycleDraft(input, deps);

    expect(first.id).not.toBe(second.id);
    await expect(deps.mesocycleRepo.getAll()).resolves.toEqual(
      expect.arrayContaining([first, second]),
    );
    await expect(deps.mesocycleRepo.getAll()).resolves.toHaveLength(2);
  });

  test('a new mesocycle gets historyLookbackDays 30 from the default settings', async () => {
    const deps = makeDeps();

    const saved = await confirmScratchMesocycleDraft(draftInput, deps);

    expect(saved.progressionSettings.historyLookbackDays).toBe(30);
    const stored = await deps.mesocycleRepo.getById(saved.id);
    expect(stored?.progressionSettings.historyLookbackDays).toBe(30);
  });

  test('snapshots the global progression settings as they are at creation time', async () => {
    const deps = makeDeps();
    const settings = await deps.settingsRepo.read();
    await deps.settingsRepo.write({
      ...settings,
      defaultProgressionSettings: {
        ...settings.defaultProgressionSettings,
        historyLookbackDays: 45,
      },
    });

    const saved = await confirmScratchMesocycleDraft(draftInput, deps);

    expect(saved.progressionSettings.historyLookbackDays).toBe(45);
  });

  test('changing the global setting afterwards does not change an already created mesocycle', async () => {
    const deps = makeDeps();
    const saved = await confirmScratchMesocycleDraft(draftInput, deps);

    const settings = await deps.settingsRepo.read();
    await deps.settingsRepo.write({
      ...settings,
      defaultProgressionSettings: {
        ...settings.defaultProgressionSettings,
        historyLookbackDays: 90,
      },
    });

    const stored = await deps.mesocycleRepo.getById(saved.id);
    expect(stored?.progressionSettings.historyLookbackDays).toBe(30);
  });
});

// --- Flow C (task 041) --------------------------------------------------------------------
//
// One real source block in the database: 6 weeks (5 working + deload on 6), 2 days a week.
// Week 3 is the interesting one — day 1 was trained through and had an exercise swapped and
// reordered along the way, day 2 was never started at all.

const SOURCE_ID = 'meso-source';

const sourceMesocycle = {
  id: SOURCE_ID,
  name: 'Push/Pull',
  lengthWeeks: 6,
  daysPerWeek: 2,
  startDate: '2026-07-01T00:00:00.000Z',
  status: 'completed' as const,
  origin: { type: 'scratch' as const },
  progressionSettings: defaultProgressionSettings,
  completedAt: '2026-08-15T00:00:00.000Z',
};

function sourceSession(
  id: string,
  weekNumber: number,
  dayNumber: number,
  status: Session['status'],
  name = '',
): Unsaved<Session> {
  return {
    id,
    mesoId: SOURCE_ID,
    weekNumber,
    dayNumber,
    name,
    isDeload: weekNumber === 6,
    prescriptionStatus: 'ready',
    status,
  };
}

function sourceExercise(
  id: string,
  sessionId: string,
  exerciseId: string,
  order: number,
  sets: number,
  status: SessionExercise['status'] = 'completed',
): Unsaved<SessionExercise> {
  return {
    id,
    sessionId,
    exerciseId,
    order,
    // Every target filled in, so a copy that kept any of them would be caught.
    setTargets: Array.from({ length: sets }, (_, index) => ({
      setNumber: index + 1,
      targetReps: 10,
      suggestedWeight: 60,
      weightHint: 'increase' as const,
    })),
    targetRir: 1,
    status,
  };
}

// Day 1 of week 3: finished, with `squat-barbell` swapped in for the row partway through and
// the two exercises reordered — order 2 before order 1 in insertion order, so extraction has
// something to sort.
const week3Day1 = sourceSession('session-w3-d1', 3, 1, 'completed', 'Push');
const week3Day1Exercises = [
  sourceExercise('sx-w3-d1-squat', 'session-w3-d1', 'squat-barbell', 2, 4),
  sourceExercise('sx-w3-d1-bench', 'session-w3-d1', 'bench-press-barbell', 1, 3),
];

// Day 2 of week 3: generated, never trained — no logs, nothing completed.
const week3Day2 = sourceSession('session-w3-d2', 3, 2, 'planned', 'Pull');
const week3Day2Exercises = [
  sourceExercise('sx-w3-d2-row', 'session-w3-d2', 'barbell-row-barbell', 1, 3, 'planned'),
];

// Week 6 is the deload.
const week6Day1 = sourceSession('session-w6-d1', 6, 1, 'completed', 'Push');
const week6Day1Exercises = [
  sourceExercise('sx-w6-d1-bench', 'session-w6-d1', 'bench-press-barbell', 1, 2),
];

async function seedSource(deps: ReturnType<typeof makeDeps>) {
  const sessions = [week3Day1, week3Day2, week6Day1];
  const exercises = [...week3Day1Exercises, ...week3Day2Exercises, ...week6Day1Exercises];
  await seedReferences(db(), { exerciseIds: exercises.map((e) => e.exerciseId) });
  await deps.mesocycleRepo.create(sourceMesocycle);
  await deps.sessionRepo.createMany(sessions);
  await deps.sessionExerciseRepo.createMany(exercises);
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject.');
}

describe('extractSourceWeekPlan', () => {
  // DoD: a week with unfinished sessions is extracted whole — structure is there whether or not
  // it was trained (решение 22.09.2026).
  test('extracts every day of the week, trained or not', async () => {
    const deps = makeDeps();
    await seedSource(deps);

    const plan = await extractSourceWeekPlan(
      { sourceMesoId: SOURCE_ID, sourceWeekNumber: 3 },
      deps,
    );

    expect(plan.days.map((day) => day.dayNumber)).toEqual([1, 2]);
    expect(plan.days[1]?.exercises).toHaveLength(1);
  });

  // DoD: the result carries no logged sets, no targets and no statuses — and exercise order and
  // the week's swaps survive.
  test('carries structure only, in the order the week ended in', async () => {
    const deps = makeDeps();
    await seedSource(deps);

    const plan = await extractSourceWeekPlan(
      { sourceMesoId: SOURCE_ID, sourceWeekNumber: 3 },
      deps,
    );

    expect(plan).toEqual<WeekPlan>({
      days: [
        {
          dayNumber: 1,
          name: 'Push',
          exercises: [
            // `squat-barbell` was swapped in during the week and comes back as itself, after
            // the bench press it was reordered behind.
            { exerciseId: 'bench-press-barbell', order: 1, sets: 3 },
            { exerciseId: 'squat-barbell', order: 2, sets: 4 },
          ],
        },
        {
          dayNumber: 2,
          name: 'Pull',
          exercises: [{ exerciseId: 'barbell-row-barbell', order: 1, sets: 3 }],
        },
      ],
    });
  });

  // DoD: the deload week is refused.
  test('refuses the source block’s deload week', async () => {
    const deps = makeDeps();
    await seedSource(deps);

    await expect(
      extractSourceWeekPlan({ sourceMesoId: SOURCE_ID, sourceWeekNumber: 6 }, deps),
    ).rejects.toThrow(/deload week/);
  });

  test('rejects a week lazy generation never reached', async () => {
    const deps = makeDeps();
    await seedSource(deps);

    expect(
      isNotFoundError(
        await rejectionOf(
          extractSourceWeekPlan({ sourceMesoId: SOURCE_ID, sourceWeekNumber: 5 }, deps),
        ),
      ),
    ).toBe(true);
  });

  test('rejects a mesocycle that does not exist', async () => {
    const deps = makeDeps();

    expect(
      isNotFoundError(
        await rejectionOf(extractSourceWeekPlan({ sourceMesoId: 'nope', sourceWeekNumber: 1 }, deps)),
      ),
    ).toBe(true);
  });
});

describe('listSourceWeeks', () => {
  // DoD: weeks with no sessions don't show up, and the deload week isn't among the options.
  test('offers the weeks that have sessions, deload excluded', async () => {
    const deps = makeDeps();
    await seedSource(deps);

    // The source block has sessions in weeks 3 and 6 only; 6 is its deload.
    await expect(listSourceWeeks(SOURCE_ID, deps)).resolves.toEqual([
      { weekNumber: 3, completedCount: 1, sessionCount: 2 },
    ]);
  });

  // DoD: a week without a single finished session is still on offer — week 3's day 2 was never
  // trained, and the week is there all the same, counted as it really is.
  test('counts what was trained without hiding what was not', async () => {
    const deps = makeDeps();
    await seedSource(deps);

    const [week] = await listSourceWeeks(SOURCE_ID, deps);

    expect(week?.completedCount).toBe(1);
    expect(week?.sessionCount).toBe(2);
  });

  test('rejects a mesocycle that does not exist', async () => {
    const deps = makeDeps();

    expect(isNotFoundError(await rejectionOf(listSourceWeeks('nope', deps)))).toBe(true);
  });
});

describe('confirmCopyWeekMesocycleDraft', () => {
  const copyInput = {
    name: 'Push/Pull 2',
    lengthWeeks: 6,
    daysPerWeek: 2,
    weekPlan: twoDayWeekPlan,
    sourceMesoId: SOURCE_ID,
    sourceWeekNumber: 3,
  };

  // DoD: the draft is saved with a copyWeek origin carrying the week number.
  test('saves a planned mesocycle with a copyWeek origin and the source week number', async () => {
    const deps = makeDeps();
    await seedSource(deps);

    const saved = await confirmCopyWeekMesocycleDraft(copyInput, deps);

    expect(saved.status).toBe('planned');
    expect(saved.startDate).toBeUndefined();
    expect(saved.origin).toEqual({
      type: 'copyWeek',
      sourceMesoId: SOURCE_ID,
      sourceWeekNumber: 3,
    });
    await expect(deps.mesocycleRepo.getById(saved.id)).resolves.toEqual(saved);
  });

  test('creates no Session — the copy is planned, not started', async () => {
    const deps = makeDeps();
    await seedSource(deps);

    const saved = await confirmCopyWeekMesocycleDraft(copyInput, deps);

    await expect(deps.sessionRepo.listByMesoId(saved.id)).resolves.toEqual([]);
  });

  test('snapshots the global progression settings, as Flow A does', async () => {
    const deps = makeDeps();
    await seedSource(deps);
    const settings = await deps.settingsRepo.read();
    await deps.settingsRepo.write({
      ...settings,
      defaultProgressionSettings: {
        ...settings.defaultProgressionSettings,
        historyLookbackDays: 45,
      },
    });

    const saved = await confirmCopyWeekMesocycleDraft(copyInput, deps);

    expect(saved.progressionSettings.historyLookbackDays).toBe(45);
  });

  test('refuses to record the source block’s deload week', async () => {
    const deps = makeDeps();
    await seedSource(deps);

    await expect(
      confirmCopyWeekMesocycleDraft({ ...copyInput, sourceWeekNumber: 6 }, deps),
    ).rejects.toThrow(/deload week/);
    await expect(deps.mesocycleRepo.getAll()).resolves.toHaveLength(1);
  });

  test('rejects a source mesocycle that no longer exists', async () => {
    const deps = makeDeps();

    expect(
      isNotFoundError(
        await rejectionOf(confirmCopyWeekMesocycleDraft({ ...copyInput, sourceMesoId: 'gone' }, deps)),
      ),
    ).toBe(true);
  });
});

describe('Flow B — template to started mesocycle', () => {
  const NOW = '2026-10-05T09:00:00.000Z';

  // Real catalog ids, so Start can write week 1 against the library the app ships.
  const template: Incoming<MesoTemplate> = {
    id: 'template-upper-lower',
    name: 'Upper/Lower',
    source: 'catalog',
    defaultLengthWeeks: 5,
    isHidden: false,
    weekPlan: {
      days: [
        {
          dayNumber: 1,
          name: 'Upper',
          exercises: [
            { exerciseId: 'bench-press-barbell', order: 1, sets: 4 },
            { exerciseId: 'barbell-row-barbell', order: 2, sets: 3 },
          ],
        },
        {
          dayNumber: 2,
          name: 'Lower',
          exercises: [{ exerciseId: 'squat-barbell', order: 1, sets: 5 }],
        },
      ],
    },
  };

  async function setUpFlowB() {
    const store = db();
    const deps = {
      ...makeDeps(),
      templateRepo: new SqliteTemplateRepository(store),
      exerciseRepo: new SqliteExerciseRepository(store),
    };
    await deps.exerciseRepo.seedCatalog(EXERCISE_CATALOG);
    await deps.templateRepo.create(template);
    return deps;
  }

  test('prepareTemplateDraft rejects with NotFoundError for an unknown template', async () => {
    const deps = await setUpFlowB();

    expect(isNotFoundError(await rejectionOf(prepareTemplateDraft('missing', deps)))).toBe(true);
  });

  test("prepareTemplateDraft names the draft past the user's existing mesocycles", async () => {
    const deps = await setUpFlowB();
    await confirmScratchMesocycleDraft({ ...draftInput, name: 'Upper/Lower' }, deps);

    const draft = await prepareTemplateDraft('template-upper-lower', deps);

    expect(draft.name).toBe('Upper/Lower 2');
  });

  test('saves a planned mesocycle with a template origin and no sessions', async () => {
    const deps = await setUpFlowB();
    const draft = toTemplateMesoBuilderDraft(
      await prepareTemplateDraft('template-upper-lower', deps),
    );

    const saved = await confirmTemplateMesocycleDraft(toTemplateMesocycleConfirmInput(draft), deps);

    expect(saved.status).toBe('planned');
    expect(saved.origin).toEqual({ type: 'template', templateId: 'template-upper-lower' });
    await expect(deps.mesocycleRepo.getById(saved.id)).resolves.toEqual(saved);
    await expect(deps.sessionRepo.listByMesoId(saved.id)).resolves.toEqual([]);
  });

  test('changing the template after the mesocycle was made does not change the mesocycle', async () => {
    const deps = await setUpFlowB();
    const draft = toTemplateMesoBuilderDraft(
      await prepareTemplateDraft('template-upper-lower', deps),
    );
    const saved = await confirmTemplateMesocycleDraft(toTemplateMesocycleConfirmInput(draft), deps);

    const stored = (await deps.templateRepo.getById('template-upper-lower'))!;
    await deps.templateRepo.update({
      ...stored,
      name: 'Upper/Lower v2',
      weekPlan: {
        days: [
          {
            dayNumber: 1,
            name: '',
            exercises: [{ exerciseId: 'deadlift-barbell', order: 1, sets: 2 }],
          },
        ],
      },
    });

    await expect(deps.mesocycleRepo.getById(saved.id)).resolves.toEqual(saved);
  });

  // DoD: template -> draft -> Save -> Start passes the invariant validators, and week 1 carries
  // only its target RIR — no reps, no weights.
  test('template -> draft -> Save -> Start gives week 1 with only a target RIR', async () => {
    const deps = await setUpFlowB();
    const draft = toTemplateMesoBuilderDraft(
      await prepareTemplateDraft('template-upper-lower', deps),
    );
    const saved = await confirmTemplateMesocycleDraft(toTemplateMesocycleConfirmInput(draft), deps);

    const started = await startMesocycle(
      saved.id,
      { store: createSqliteMesocycleStartStore(db()) },
      NOW,
    );

    expect(started.status).toBe('active');
    expect(started.origin).toEqual({ type: 'template', templateId: 'template-upper-lower' });
    const sessions = await deps.sessionRepo.listByMesoId(saved.id);
    expect(sessions.map(({ weekNumber, dayNumber }) => [weekNumber, dayNumber]).sort()).toEqual([
      [1, 1],
      [1, 2],
    ]);
    const week1 = await Promise.all(
      sessions
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .map((session) => deps.sessionExerciseRepo.listBySessionId(session.id)),
    );
    expect(
      week1.map((exercises) =>
        [...exercises]
          .sort((a, b) => a.order - b.order)
          .map(({ exerciseId, setTargets }) => [exerciseId, setTargets.length]),
      ),
    ).toEqual([
      [
        ['bench-press-barbell', 4],
        ['barbell-row-barbell', 3],
      ],
      [['squat-barbell', 5]],
    ]);
    const exercises = week1.flat();
    // 6 weeks (Flow A's default length): startRir = min(3, 5 − 1) = 3.
    expect(exercises.every((exercise) => exercise.targetRir === 3)).toBe(true);
    expect(
      exercises.flatMap((exercise) => exercise.setTargets).every(
        (target) => target.targetReps === undefined && target.suggestedWeight === undefined,
      ),
    ).toBe(true);
  });
});
