// Workout screen model — task 088 (08.7 · Тренировка; 05 · Workout Execution & Logging). The
// screen gets one ready shape instead of stitching several queries together in a component. The
// session tree is assembled by `SessionTreeRepository`; this only maps it, with the rules from
// `domain/workoutViewRules.ts`. Storage is the source of truth: every workout mutation writes there
// and the screen re-reads this model, so nothing here is cached between calls.

import type { Equipment, MuscleGroup } from '@domain/catalog';
import { NotFoundError } from '@domain/errors';
import type { Session, SessionExerciseStatus, SetLog, TargetIndicator } from '@domain/execution';
import { currentSession } from '@domain/mesoGridBuilders';
import { isDeloadWeek } from '@domain/progressionPlan';
import { targetIndicator } from '@domain/progressionTargetIndicator';
import type { WorkoutMode, WorkoutSlot } from '@domain/workoutView';
import {
  canFinishSession,
  previewSourceSession,
  sessionDisplayDate,
  sessionProgress,
  unlockingSlot,
  workoutMode,
} from '@domain/workoutViewRules';
import type { SessionRepository } from '@repositories/session';
import type {
  SessionExerciseTree,
  SessionTree,
  SessionTreeRepository,
} from '@repositories/sessionTree';

export type WorkoutSessionDeps = {
  sessionTreeRepo: SessionTreeRepository;
  sessionRepo: SessionRepository;
};

/** One set row (08.7, "Строка подхода"). */
export type WorkoutSetRow = {
  setNumber: number;
  targetReps?: number;
  suggestedWeight?: number;
  /**
   * Deload only: the reps actually done in this set last working week — the same exercise and set
   * number in the session the deload was planned from (05, "Deload-неделя"). The reps placeholder
   * shows it as a guide; absent when that set wasn't logged there.
   */
  referenceReps?: number;
  /** What was logged, if the row is logged. */
  log?: { weight: number; reps: number };
  /** `✓` / `+N` / `−N` — only for a logged row whose set had `targetReps`. */
  indicator?: TargetIndicator;
  /** The exercise's first unlogged row, whose Log box gets the accent outline. Live mode only. */
  isFirstUnlogged: boolean;
};

/**
 * What the exercise's `⋯` menu allows (08.7, "Меню упражнения"). Every flag is `false` outside live
 * mode, where the menu isn't shown.
 */
export type WorkoutExerciseActions = {
  canReplace: boolean;
  canAddSet: boolean;
  /** `false` with a single row — "Only one set". */
  canRemoveLastSet: boolean;
  /** `false` for the first exercise — "Already first". */
  canMoveUp: boolean;
  /** `false` for the last exercise — "Already last". */
  canMoveDown: boolean;
  /** Available whether or not sets are logged; replaced by `canUnskip` once skipped. */
  canSkip: boolean;
  canUnskip: boolean;
  /**
   * Available whether or not sets are logged; with `hasLoggedSets` the confirmation warns that
   * they're deleted too (05, "Удалить упражнение").
   */
  canDelete: boolean;
};

/** One exercise card (08.7, "Карточка упражнения"). */
export type WorkoutExercise = {
  /**
   * The session exercise the card acts on. In preview it's the source session's one — use it as a
   * list key only; there's nothing to act on.
   */
  sessionExerciseId: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: Equipment;
  /** Not shown in preview — the day isn't programmed yet. */
  targetRir?: number;
  /** `planned` in preview. */
  status: SessionExerciseStatus;
  /**
   * The set rows. A skipped exercise lists only its logged rows (`hasSkippedRows` stands in for the
   * rest); none in preview.
   */
  rows: WorkoutSetRow[];
  /** Skipped with rows left unlogged — the card shows a single `Skipped` row for them. */
  hasSkippedRows: boolean;
  /** Rows planned, for the menu subtitle `2 sets planned · 1 logged`. */
  plannedSetCount: number;
  loggedSetCount: number;
  hasLoggedSets: boolean;
  actions: WorkoutExerciseActions;
};

/** The header's title and subtitle (08.7, "Шапка"). */
export type WorkoutHeader = {
  weekNumber: number;
  dayNumber: number;
  /** UTC ISO: `completedAt` once completed, `startedAt` once started, none before. */
  date?: string;
  mesocycleName: string;
  isDeload: boolean;
  /** The round accent check — completed sessions only. */
  isCompleted: boolean;
};

/** What the header's `⋯` menu allows for the session (08.7, "Меню шапки"). */
export type WorkoutSessionActions = {
  /** Live, and not a deload session — nothing can be added there (03, rule 6). */
  canAddExercise: boolean;
  /** Live, with no set logged in the session. */
  canSkipWorkout: boolean;
};

export type WorkoutSessionModel = {
  /** Absent only for the preview of a day whose session doesn't exist yet. */
  sessionId?: string;
  mesoId: string;
  mode: WorkoutMode;
  header: WorkoutHeader;
  /** 0..1, for the progress bar. */
  progress: number;
  exercises: WorkoutExercise[];
  actions: WorkoutSessionActions;
  /** The `Finish workout` button: live, and every exercise `completed` or `skipped`. */
  showFinish: boolean;
  /**
   * Read-only only: the session the `Next workout` button opens — the mesocycle's current one (in
   * progress, else the earliest ready; see `currentSession`). Absent when nothing is left to do.
   */
  nextSessionId?: string;
  /** Preview only — `Unlocks when you finish Week W Day D`. */
  unlocksAfter?: { weekNumber: number; dayNumber: number };
};

const NO_EXERCISE_ACTIONS: WorkoutExerciseActions = {
  canReplace: false,
  canAddSet: false,
  canRemoveLastSet: false,
  canMoveUp: false,
  canMoveDown: false,
  canSkip: false,
  canUnskip: false,
  canDelete: false,
};

/**
 * The set logs of the session a deload session was planned from, by exercise — where a deload
 * row's `referenceReps` comes from. Empty for any other session.
 */
type ReferenceLogs = ReadonlyMap<string, readonly SetLog[]>;

function referenceLogsOf(source: SessionTree | null): ReferenceLogs {
  const byExercise = new Map<string, SetLog[]>();
  for (const { sessionExercise, setLogs } of source?.exercises ?? []) {
    byExercise.set(sessionExercise.exerciseId, [
      ...(byExercise.get(sessionExercise.exerciseId) ?? []),
      ...setLogs,
    ]);
  }
  return byExercise;
}

function toRows(
  tree: SessionExerciseTree,
  mode: WorkoutMode,
  referenceLogs: ReferenceLogs,
): WorkoutSetRow[] {
  const { sessionExercise, setLogs } = tree;
  const exerciseReferenceLogs = referenceLogs.get(sessionExercise.exerciseId) ?? [];
  const skipped = sessionExercise.status === 'skipped';
  const firstUnlogged =
    mode === 'live' && !skipped
      ? sessionExercise.setTargets.find(
          (target) => !setLogs.some((log) => log.setNumber === target.setNumber),
        )
      : undefined;

  const rows: WorkoutSetRow[] = [];
  for (const target of sessionExercise.setTargets) {
    const log = setLogs.find((candidate) => candidate.setNumber === target.setNumber);
    if (skipped && !log) {
      continue;
    }
    const row: WorkoutSetRow = {
      setNumber: target.setNumber,
      isFirstUnlogged: target === firstUnlogged,
    };
    if (target.targetReps !== undefined) {
      row.targetReps = target.targetReps;
    }
    if (target.suggestedWeight !== undefined) {
      row.suggestedWeight = target.suggestedWeight;
    }
    const reference = exerciseReferenceLogs.find(
      (candidate) => candidate.setNumber === target.setNumber,
    );
    if (reference) {
      row.referenceReps = reference.reps;
    }
    if (log) {
      row.log = { weight: log.weight, reps: log.reps };
      const indicator = targetIndicator(target, log);
      if (indicator) {
        row.indicator = indicator;
      }
    }
    rows.push(row);
  }
  return rows;
}

function toExercise(
  tree: SessionExerciseTree,
  index: number,
  count: number,
  mode: WorkoutMode,
  referenceLogs: ReferenceLogs,
): WorkoutExercise {
  const { sessionExercise, exercise, setLogs } = tree;
  const skipped = sessionExercise.status === 'skipped';
  const loggedSetCount = sessionExercise.setTargets.filter((target) =>
    setLogs.some((log) => log.setNumber === target.setNumber),
  ).length;
  const plannedSetCount = sessionExercise.setTargets.length;

  const model: WorkoutExercise = {
    sessionExerciseId: sessionExercise.id,
    exerciseId: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    targetRir: sessionExercise.targetRir,
    status: sessionExercise.status,
    rows: toRows(tree, mode, referenceLogs),
    hasSkippedRows: skipped && loggedSetCount < plannedSetCount,
    plannedSetCount,
    loggedSetCount,
    hasLoggedSets: loggedSetCount > 0,
    actions:
      mode === 'live'
        ? {
            canReplace: true,
            canAddSet: true,
            canRemoveLastSet: plannedSetCount > 1,
            canMoveUp: index > 0,
            canMoveDown: index < count - 1,
            canSkip: !skipped,
            canUnskip: skipped,
            canDelete: true,
          }
        : NO_EXERCISE_ACTIONS,
  };
  if (exercise.equipment !== undefined) {
    model.equipment = exercise.equipment;
  }
  return model;
}

/**
 * A live or read-only session, from its own tree. `source` is the tree of the session a deload
 * session was planned from (`null` otherwise) — see `referenceReps`. `next` is the mesocycle's
 * current session, for `nextSessionId`.
 */
function fromTree(
  tree: SessionTree,
  source: SessionTree | null,
  next: Session | undefined,
): WorkoutSessionModel {
  const { session, mesocycle, exercises } = tree;
  const mode = workoutMode(session);
  const live = mode === 'live';
  const header: WorkoutHeader = {
    weekNumber: session.weekNumber,
    dayNumber: session.dayNumber,
    mesocycleName: mesocycle.name,
    isDeload: session.isDeload,
    isCompleted: session.status === 'completed',
  };
  const date = sessionDisplayDate(session);
  if (date !== undefined) {
    header.date = date;
  }
  const sessionExercises = exercises.map((exercise) => exercise.sessionExercise);
  const model: WorkoutSessionModel = {
    sessionId: session.id,
    mesoId: session.mesoId,
    mode,
    header,
    progress: sessionProgress(session, exercises),
    exercises: exercises.map((exercise, index) =>
      toExercise(exercise, index, exercises.length, mode, referenceLogsOf(source)),
    ),
    actions: {
      canAddExercise: live && !session.isDeload,
      canSkipWorkout: live && exercises.every((exercise) => exercise.setLogs.length === 0),
    },
    showFinish: live && canFinishSession(sessionExercises),
  };
  if (mode === 'readonly' && next !== undefined) {
    model.nextSessionId = next.id;
  }
  return model;
}

/**
 * The preview of `slot` — its session is `awaiting_source`, or doesn't exist yet (`session`
 * absent): the exercise list of the latest programmed session of the same day, with no rows,
 * targets or actions.
 */
async function previewOf(
  slot: WorkoutSlot,
  session: Session | undefined,
  deps: WorkoutSessionDeps,
): Promise<WorkoutSessionModel> {
  const source = previewSourceSession(slot, await deps.sessionRepo.listByMesoId(slot.mesoId));
  const tree = source && (await deps.sessionTreeRepo.getBySessionId(source.id));
  if (!tree) {
    throw new NotFoundError(
      `Week ${slot.weekNumber}, day ${slot.dayNumber} of mesocycle "${slot.mesoId}" has no programmed session of the same day to preview.`,
    );
  }
  const { weekNumber, dayNumber } = unlockingSlot(slot);
  const model: WorkoutSessionModel = {
    mesoId: slot.mesoId,
    mode: 'preview',
    header: {
      weekNumber: slot.weekNumber,
      dayNumber: slot.dayNumber,
      mesocycleName: tree.mesocycle.name,
      isDeload: session?.isDeload ?? isDeloadWeek(tree.mesocycle.lengthWeeks, slot.weekNumber),
      isCompleted: false,
    },
    progress: 0,
    exercises: tree.exercises.map(({ sessionExercise, exercise }) => {
      const preview: WorkoutExercise = {
        sessionExerciseId: sessionExercise.id,
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        status: 'planned',
        rows: [],
        hasSkippedRows: false,
        plannedSetCount: 0,
        loggedSetCount: 0,
        hasLoggedSets: false,
        actions: NO_EXERCISE_ACTIONS,
      };
      if (exercise.equipment !== undefined) {
        preview.equipment = exercise.equipment;
      }
      return preview;
    }),
    actions: { canAddExercise: false, canSkipWorkout: false },
    showFinish: false,
    unlocksAfter: { weekNumber, dayNumber },
  };
  if (session) {
    model.sessionId = session.id;
  }
  return model;
}

/**
 * The workout screen model of session `sessionId`, in the mode its status calls for: live,
 * read-only, or — for an `awaiting_source` session — preview.
 *
 * Rejects with `NotFoundError` if the session doesn't exist, if its mesocycle or one of its
 * exercises is missing, or if a preview has no programmed session of the same day to show.
 */
export async function getWorkoutSession(
  sessionId: string,
  deps: WorkoutSessionDeps,
): Promise<WorkoutSessionModel> {
  const tree = await deps.sessionTreeRepo.getBySessionId(sessionId);
  if (!tree) {
    throw new NotFoundError(`Session "${sessionId}" does not exist.`);
  }
  if (workoutMode(tree.session) === 'preview') {
    const { mesoId, weekNumber, dayNumber } = tree.session;
    return previewOf({ mesoId, weekNumber, dayNumber }, tree.session, deps);
  }
  const { isDeload, sourceSessionId, mesoId } = tree.session;
  const source =
    isDeload && sourceSessionId !== undefined
      ? await deps.sessionTreeRepo.getBySessionId(sourceSessionId)
      : null;
  const next =
    workoutMode(tree.session) === 'readonly'
      ? currentSession(await deps.sessionRepo.listByMesoId(mesoId))
      : undefined;
  return fromTree(tree, source, next);
}

/**
 * The workout screen model of a grid cell addressed by week and day — for a day whose session may
 * not exist yet (the `awaiting` cells of the mesocycle overview, 08.7). An existing session is
 * returned as `getWorkoutSession` would; a missing one is a preview.
 *
 * Rejects as `getWorkoutSession` does.
 */
export async function getWorkoutSlot(
  slot: WorkoutSlot,
  deps: WorkoutSessionDeps,
): Promise<WorkoutSessionModel> {
  const sessions = await deps.sessionRepo.listByMesoIdAndWeekNumber(slot.mesoId, slot.weekNumber);
  const existing = sessions.find((session) => session.dayNumber === slot.dayNumber);
  return existing ? getWorkoutSession(existing.id, deps) : previewOf(slot, undefined, deps);
}
