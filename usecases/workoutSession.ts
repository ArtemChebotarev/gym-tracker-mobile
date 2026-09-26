// Workout screen model — task 088 (08.7 · Тренировка; 05 · Workout Execution & Logging). The
// screen gets one ready shape instead of stitching several queries together in a component. The
// session tree is assembled by `SessionTreeRepository`; this only maps it, with the rules from
// `domain/workoutViewRules.ts`. Storage is the source of truth: every workout mutation writes there
// and the screen re-reads this model, so nothing here is cached between calls.

import type { Equipment, MuscleGroup } from '@domain/catalog';
import { NotFoundError } from '@domain/errors';
import type { Session, SessionExerciseStatus, SetLog, TargetIndicator } from '@domain/execution';
import { currentSession } from '@domain/mesoGridBuilders';
import type { ProgressionSettings } from '@domain/mesocycle';
import { canFinishMesocycle } from '@domain/mesocycleLifecycle';
import { isDeloadWeek } from '@domain/mesocycleWeeks';
import { isNotDone, type NotDoneStatus } from '@domain/sessionExerciseStatus';
import { targetIndicatorAtWeight } from '@domain/progressionTargetIndicator';
import type { WeightSwap } from '@domain/weightSwap';
import { buildWeightSwap } from '@domain/weightSwapRules';
import type { WorkoutMode, WorkoutSlot } from '@domain/workoutView';
import {
  canFinishSession,
  type ExerciseWeightHint,
  exerciseWeightHints,
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
  /**
   * What was logged, if the row is logged. On a `bodyweight-weighted` exercise `weight` is the
   * added weight and `bodyWeight` the body weight of the moment — the total is their sum, and it
   * stays what it was even after the block's body weight changes (task 105).
   */
  log?: { weight: number; reps: number; bodyWeight?: number };
  /** `✓` / `+N` / `−N` — only for a logged row whose set had `targetReps`. */
  indicator?: TargetIndicator;
  /**
   * What this set's target is worth at another weight (03, rule 7; task 120) — the screen reads
   * it with `evaluateWeightSwap` for whatever weight the row holds. Absent when the question
   * doesn't arise at all: a deload set, a pure `bodyweight` one, or a weighted bodyweight one
   * while the block has no body weight yet. See `buildWeightSwap`.
   */
  weightSwap?: WeightSwap;
  /** The exercise's first unlogged row, whose Log box gets the accent outline. Live mode only. */
  isFirstUnlogged: boolean;
  /**
   * An unlogged row of an exercise closed without being done, and how: `skipped` along with it
   * (05, "Пропустить упражнение"), or `abandoned` by Stop mesocycle (136). The card shows it as a
   * `Skipped` or `Abandoned` row; absent otherwise.
   */
  notDone?: NotDoneStatus;
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
   * Go heavier / go lighter, from last week's reps (03, rule 3). Live mode only, and not on a
   * skipped exercise — it's advice for doing the sets; absent when there's none.
   */
  weightHints?: ExerciseWeightHint[];
  /**
   * Every set row — in a skipped or abandoned exercise the unlogged ones carry `notDone`; none in
   * preview.
   */
  rows: WorkoutSetRow[];
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
  /**
   * Live, with an exercise still `planned` — Skip workout skips those (05, "Пропустить
   * тренировку"). Once every exercise is done, Finish takes its place.
   */
  canSkipWorkout: boolean;
  /**
   * The mesocycle is `active` (052). Stop is a mesocycle action, so it's there in every mode that
   * shows the menu — a day of the block opened read-only can still be the one you call the block
   * off from — but a block already closed has nothing to stop, and its sessions open in history,
   * which has no menu at all (08.9).
   */
  canStopMesocycle: boolean;
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
  /**
   * The block's body weight (task 105), for its bodyweight exercises: it fills a pure one's Weight
   * field and adds onto a weighted one's total. Absent until it's been asked for — the screen then
   * asks the first time a bodyweight exercise comes up.
   */
  bodyWeight?: number;
  actions: WorkoutSessionActions;
  /** The `Finish workout` button: live, and every exercise `completed` or `skipped`. */
  showFinish: boolean;
  /**
   * The `Finish mesocycle` button (052): the block is `active` and every session of it is final —
   * this is the last workout, already done. It closes the block by hand; nothing closes it on its
   * own (Artem's review of 052).
   */
  showFinishMesocycle: boolean;
  /**
   * The `Copy current meso` button (04 · Meso Creation Flows, "Завершение мезоцикла"): the block
   * is `completed`, so the next one is usually a week of it copied. It takes the place of
   * `Finish mesocycle`, which only ever shows while the block is still `active` — the two can't
   * both be true.
   *
   * Finishing a block doesn't move the screen off it any more: standing on the workout you just
   * finished is the point, and this is offered from there (Artem, 24.09.2026). Every session of a
   * finished block carries it, not only its last one — it is an action on the block, which is also
   * where its history will go.
   *
   * A stopped (`abandoned`) block gets no button: it was called off, and offering it as the basis
   * of the next one reads as not having noticed.
   *
   * The label says `Copy current meso` (Artem's wording): "current" is the block being stood in,
   * and `Copy` is what the same action is already called on 08.3's finished rows — one word for
   * one thing, rather than a second name for the way into Flow C.
   */
  showCopyMesocycle: boolean;
  /**
   * Read-only only: the session the `Next workout` button opens — the mesocycle's current one (in
   * progress, else the earliest ready; see `currentSession`). Absent when nothing is left to do,
   * and in history mode always — a block that has ended has no next workout (08.9).
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

/**
 * What the rows and cards of one session need beyond the session tree itself: the block's
 * settings and body weight, and — for a deload — the working session it was planned from.
 */
type SessionContext = {
  settings: ProgressionSettings;
  isDeload: boolean;
  bodyWeight?: number;
  referenceLogs: ReferenceLogs;
};

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
  context: SessionContext,
): WorkoutSetRow[] {
  const { sessionExercise, exercise, setLogs } = tree;
  const exerciseReferenceLogs = context.referenceLogs.get(sessionExercise.exerciseId) ?? [];
  const notDone = isNotDone(sessionExercise.status) ? sessionExercise.status : undefined;
  const firstUnlogged =
    mode === 'live' && notDone === undefined
      ? sessionExercise.setTargets.find(
          (target) => !setLogs.some((log) => log.setNumber === target.setNumber),
        )
      : undefined;

  const rows: WorkoutSetRow[] = [];
  for (const target of sessionExercise.setTargets) {
    const log = setLogs.find((candidate) => candidate.setNumber === target.setNumber);
    const row: WorkoutSetRow = {
      setNumber: target.setNumber,
      isFirstUnlogged: target === firstUnlogged,
    };
    if (notDone !== undefined && !log) {
      row.notDone = notDone;
    }
    if (target.targetReps !== undefined) {
      row.targetReps = target.targetReps;
    }
    if (target.suggestedWeight !== undefined) {
      row.suggestedWeight = target.suggestedWeight;
    }
    // Rule 7 asks only about this set's own target, so every row gets its own: with targets
    // 10 / 10 / 9 the same weight is worth different reps in the third set than in the first.
    const weightSwap = buildWeightSwap({
      target,
      settings: context.settings,
      isDeload: context.isDeload,
      equipment: exercise.equipment,
      bodyWeight: context.bodyWeight,
    });
    if (weightSwap !== undefined) {
      row.weightSwap = weightSwap;
    }
    const reference = exerciseReferenceLogs.find(
      (candidate) => candidate.setNumber === target.setNumber,
    );
    if (reference) {
      row.referenceReps = reference.reps;
    }
    if (log) {
      row.log = { weight: log.weight, reps: log.reps };
      if (log.bodyWeight !== undefined) {
        row.log.bodyWeight = log.bodyWeight;
      }
      const indicator = targetIndicatorAtWeight(target, log, weightSwap);
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
  context: SessionContext,
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
    rows: toRows(tree, mode, context),
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
  if (mode === 'live' && !skipped) {
    const weightHints = exerciseWeightHints(sessionExercise.setTargets, context.settings);
    if (weightHints.length > 0) {
      model.weightHints = weightHints;
    }
  }
  return model;
}

/**
 * A live, read-only or history session, from its own tree. `source` is the tree of the session a
 * deload session was planned from (`null` otherwise) — see `referenceReps`. `mesoSessions` is every
 * session of the mesocycle, which answers what `Next workout` opens and whether the block has
 * anything left to train; it is loaded for a read-only session only, and `null` for a live or
 * history one — a live session is itself the proof that the block isn't done, and a closed block
 * has neither a next workout nor a Finish left in it.
 */
function fromTree(
  tree: SessionTree,
  source: SessionTree | null,
  mesoSessions: readonly Session[] | null,
): WorkoutSessionModel {
  const { session, mesocycle, exercises } = tree;
  const mode = workoutMode(session, mesocycle);
  const live = mode === 'live';
  const next = mesoSessions === null ? undefined : currentSession(mesoSessions);
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
  const context: SessionContext = {
    settings: mesocycle.progressionSettings,
    isDeload: session.isDeload,
    referenceLogs: referenceLogsOf(source),
  };
  if (mesocycle.bodyWeight !== undefined) {
    context.bodyWeight = mesocycle.bodyWeight;
  }
  const model: WorkoutSessionModel = {
    sessionId: session.id,
    mesoId: session.mesoId,
    mode,
    header,
    progress: sessionProgress(session, exercises),
    exercises: exercises.map((exercise, index) =>
      toExercise(exercise, index, exercises.length, mode, context),
    ),
    actions: {
      canAddExercise: live && !session.isDeload,
      canSkipWorkout: live && !canFinishSession(sessionExercises),
      canStopMesocycle: mesocycle.status === 'active',
    },
    showFinish: live && canFinishSession(sessionExercises),
    showFinishMesocycle: mesoSessions !== null && canFinishMesocycle(mesocycle, mesoSessions),
    showCopyMesocycle: mesocycle.status === 'completed',
  };
  if (mesocycle.bodyWeight !== undefined) {
    model.bodyWeight = mesocycle.bodyWeight;
  }
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
    actions: {
      canAddExercise: false,
      canSkipWorkout: false,
      canStopMesocycle: tree.mesocycle.status === 'active',
    },
    showFinish: false,
    // A preview is a day still to come, so the block always has it left to train.
    showFinishMesocycle: false,
    // A preview is a day that hasn't been programmed yet, which only exists inside a running
    // block — there is nothing finished here to build the next one from.
    showCopyMesocycle: false,
    unlocksAfter: { weekNumber, dayNumber },
  };
  if (session) {
    model.sessionId = session.id;
  }
  return model;
}

/**
 * The workout screen model of session `sessionId`, in the mode its status calls for: live,
 * read-only, history — any session of a block that has ended (08.9) — or, for an `awaiting_source`
 * session, preview.
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
  const mode = workoutMode(tree.session, tree.mesocycle);
  if (mode === 'preview') {
    const { mesoId, weekNumber, dayNumber } = tree.session;
    return previewOf({ mesoId, weekNumber, dayNumber }, tree.session, deps);
  }
  const { isDeload, sourceSessionId, mesoId } = tree.session;
  const source =
    isDeload && sourceSessionId !== undefined
      ? await deps.sessionTreeRepo.getBySessionId(sourceSessionId)
      : null;
  const mesoSessions = mode === 'readonly' ? await deps.sessionRepo.listByMesoId(mesoId) : null;
  return fromTree(tree, source, mesoSessions);
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
