// Pure helpers behind the Today tab (app/(tabs)/index.tsx, `TodayScreen`) — see the code-style
// skill; they live here because every file under app/ is a route.

import { PLAN_MESOCYCLE_LABEL } from '@components/MesocyclesScreenLogic';
import { CheckIcon } from '@design/icons/CheckIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { InfoIcon } from '@design/icons/InfoIcon';
import { TabTodayIcon } from '@design/icons/TabTodayIcon';
import type { RestNext } from '@domain/restTimer';
import { nextSetAfter, type RestSetRow } from '@domain/restTimerRules';
import type { WorkoutMode } from '@domain/workoutView';
import type { WorkoutExercise } from '@usecases/workoutSession';
import type { OnboardingFlags } from '@repositories/settings';

/**
 * The alert title when a set can't be logged because another session is `in_progress` (05,
 * "Жизненный цикл сессии").
 */
export function formatInProgressConflict(session: {
  weekNumber: number;
  dayNumber: number;
}): string {
  return `Finish Week ${session.weekNumber} Day ${session.dayNumber} first`;
}

/**
 * Why the Today tab has no session to show: no active mesocycle — and none planned, or one that is
 * (GT-38) — the active one has nothing left (`getTodayWorkout`, 099), or the session couldn't be
 * loaded — a picked day that no longer exists.
 */
export type TodayEmptyReason = 'noActiveMesocycle' | 'cyclePlanned' | 'allDone' | 'unavailable';

/**
 * The EmptyState for `reason` — an invitation, not an apology (08.0.1, "Empty states"). Without an
 * active cycle it invites planning one (08, "Сегодня") — through the same creation-method sheet
 * the `+` on 08.3 raises, since finished cycles may well exist to copy even when none is running
 * (`hasHadCycles`: with none ever, the title says `first` rather than `next`);
 * with the cycle done it closes it (052 — the same Finish the last workout offers, so leaving that
 * screen isn't a dead end); otherwise it leads to the cycles.
 */
export function todayEmptyCopy(
  reason: TodayEmptyReason,
  hasHadCycles = true,
): {
  icon: IconComponent;
  title: string;
  description: string;
  actionLabel: string;
} {
  switch (reason) {
    case 'noActiveMesocycle':
      return {
        icon: TabTodayIcon,
        // `next` says nothing to someone who has never had one (08.0.1, GT-51); until it is known
        // that they haven't, the old wording stands — it is wrong for fewer people than "first".
        title: hasHadCycles ? 'Start your next training cycle' : 'Start your first training cycle',
        description: 'Plan one and its workouts will show up here.',
        actionLabel: PLAN_MESOCYCLE_LABEL,
      };
    case 'cyclePlanned':
      // Not a launch from here: several cycles can be planned and only one is started, so the
      // choice is made in the Cycles list (08.11, "2. Today: цикл запланирован").
      return {
        icon: TabTodayIcon,
        title: 'Your next cycle is ready',
        description: 'Open Cycles and tap Start to begin.',
        actionLabel: 'Go to Cycles',
      };
    case 'allDone':
      return {
        icon: CheckIcon,
        title: 'Training cycle complete',
        description: 'Every workout is done. Finish it to move it to Completed.',
        actionLabel: 'Finish cycle',
      };
    case 'unavailable':
      return {
        icon: InfoIcon,
        title: 'Pick another workout',
        description: "This workout isn't available anymore. Choose another day to train.",
        actionLabel: 'Open cycles',
      };
  }
}

/**
 * The Finish mesocycle confirmation's message (052). Finishing loses nothing — it is the cycle
 * ending the way it was meant to — and the cycle is where the next one is copied from (04, Flow C),
 * so the confirmation says where it goes rather than warning.
 */
export const FINISH_MESOCYCLE_CONFIRMATION =
  'Every workout is done. The cycle moves to Completed — you can start the next one from any of its weeks.';

/**
 * Whether the first-workout coachmark tour shows over the Today tab (08.11, GT-42): once, on the
 * first live workout, and not while the Welcome dialog is still up — two modals at once don't
 * present reliably, and Welcome comes first. A deload session is left to its own popup (GT-43),
 * and the flags must have been read: a tour that flashed and went would be worse than one that
 * waits a frame.
 */
export function shouldShowWorkoutCoachmarks(
  flags: OnboardingFlags | undefined,
  session: { mode: WorkoutMode; isDeload: boolean } | undefined,
): boolean {
  return (
    flags !== undefined &&
    flags.welcomeSeen &&
    !flags.coachmarksSeen &&
    session !== undefined &&
    session.mode === 'live' &&
    !session.isDeload
  );
}

/**
 * Whether the first-deload popup shows over the Today tab (08.11, GT-43): once, on the first live
 * deload session the app opens, after the Welcome dialog. The flag is set when it is closed, so an
 * app killed with it open shows it again; and the flags must have been read.
 */
export function shouldShowDeloadIntro(
  flags: OnboardingFlags | undefined,
  session: { mode: WorkoutMode; isDeload: boolean } | undefined,
): boolean {
  return (
    flags !== undefined &&
    flags.welcomeSeen &&
    !flags.deloadIntroSeen &&
    session !== undefined &&
    session.mode === 'live' &&
    session.isDeload
  );
}

/** What a logged set does to the rest timer (10.1 FR-5, GT-86). */
export type RestAfterLog =
  /** The rest before the next set starts — replacing whatever rest there was. */
  | {
      kind: 'start';
      rest: { sessionExerciseId: string; next: RestNext; durationSec: number };
    }
  /** No rest follows — the workout has nothing left, or the exercise has no rest: any rest left is over. */
  | { kind: 'stop' }
  /** A correction, not the next set done: the rest that is running carries on untouched. */
  | { kind: 'keep' };

/** The key a set is remembered by among those already logged in this workout. */
export function loggedSetKey(sessionExerciseId: string, setNumber: number): string {
  return `${sessionExerciseId}:${setNumber}`;
}

/** An exercise's rows as the rest timer reads them — its sets, or an interval's rounds. */
function restRowsOf(exercise: WorkoutExercise): RestSetRow[] {
  const rows: readonly { number: number; log?: unknown; notDone?: unknown }[] =
    exercise.type === 'interval'
      ? exercise.rounds.map((round) => ({ ...round, number: round.roundNumber }))
      : exercise.rows.map((row) => ({ ...row, number: row.setNumber }));
  return rows.map((row) => ({
    setNumber: row.number,
    open: row.log === undefined && row.notDone === undefined,
  }));
}

/** Whether `exercise` still has a set or a round to do — logged neither nor closed as not done. */
function hasWorkLeft(exercise: WorkoutExercise): boolean {
  return restRowsOf(exercise).some((row) => row.open);
}

/**
 * The rest after row `rowNumber` of `exercise`: the exercise's own rest for a set (Settings for
 * strength, its field for power), the round's own rest for an interval round (FR-6).
 */
function restSecAfter(exercise: WorkoutExercise, rowNumber: number): number | undefined {
  const restSec =
    exercise.type === 'interval'
      ? exercise.rounds.find((round) => round.roundNumber === rowNumber)?.restSec
      : exercise.restSec;
  return restSec !== undefined && restSec > 0 ? restSec : undefined;
}

/**
 * The exercise the rest after the last set of card `index` is before: the first one below it with
 * work left, else the first one above — the workout may be done out of order. `undefined` when the
 * workout has nothing left to do.
 */
function nextExerciseWithWorkLeft(
  exercises: readonly WorkoutExercise[],
  index: number,
): WorkoutExercise | undefined {
  const others = [...exercises.slice(index + 1), ...exercises.slice(0, index)];
  return others.find(hasWorkLeft);
}

/**
 * What logging row `setNumber` of `exercise` — a set, or an interval's round logged by hand
 * (GT-89) — does to the rest timer (10.1 FR-5, FR-6, GT-86; Artem, 18.10.2026). A log is a
 * correction, and leaves the timer alone, when an exercise further down the workout has been
 * started already — this one is being fixed or caught up on, the work is below — or when this very
 * row was logged before in this workout and is logged again. Otherwise the rest before the next
 * row still to do starts — and after the exercise's last row, the rest before the next exercise
 * with work left, unless the workout has none (Artem, 19.10.2026): n rows, n rests, but none at the
 * very end.
 *
 * `exercises` is the workout's cards in order; `alreadyLogged` the keys (`loggedSetKey`) of the
 * rows logged so far in it.
 */
export function restAfterLog(
  exercises: readonly WorkoutExercise[],
  exercise: WorkoutExercise,
  setNumber: number,
  alreadyLogged: ReadonlySet<string>,
): RestAfterLog {
  const index = exercises.findIndex(
    (each) => each.sessionExerciseId === exercise.sessionExerciseId,
  );
  const startedBelow = exercises.slice(index + 1).some((each) => each.hasLoggedSets);
  if (startedBelow || alreadyLogged.has(loggedSetKey(exercise.sessionExerciseId, setNumber))) {
    return { kind: 'keep' };
  }
  const durationSec = restSecAfter(exercise, setNumber);
  if (durationSec === undefined) return { kind: 'stop' };
  const nextRowNumber = nextSetAfter(restRowsOf(exercise), setNumber);
  let next: RestNext;
  if (nextRowNumber !== undefined) {
    next =
      exercise.type === 'interval'
        ? { kind: 'round', roundNumber: nextRowNumber }
        : { kind: 'set', setNumber: nextRowNumber };
  } else {
    const nextExercise = nextExerciseWithWorkLeft(exercises, index);
    if (nextExercise === undefined) return { kind: 'stop' };
    next = { kind: 'exercise', name: nextExercise.name };
  }
  return {
    kind: 'start',
    rest: { sessionExerciseId: exercise.sessionExerciseId, next, durationSec },
  };
}
