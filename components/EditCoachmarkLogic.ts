// Pure logic behind the edit coachmark (GT-224; 08.11 · Onboarding, "Правки в тренировке", board
// EditCoach) — see the code-style skill.
//
// An edit made in a workout is carried over to the weeks after it, a Skip is not, and nobody knows
// that until an exercise deleted for one day turns out to be gone from the plan. So the first edit
// that carries over gets one coachmark, ringing the card it changed, right after the edit lands.
//
// Delete has no card left to ring: its own confirmation says it instead
// (`formatDeleteExerciseWarning`). And on the last working week there is nothing for the edit to
// carry over to — only the deload, which is planned by its own rules — so the coachmark waits for
// the next cycle rather than say something that isn't true this time (Artem, 04.11.2026).

import type { BadgeExplanation } from '@components/RirExplanationLogic';
import { ArrowRightIcon } from '@design/icons/ArrowRightIcon';
import { SkipIcon } from '@design/icons/SkipIcon';
import type { WorkoutMode } from '@domain/workoutView';
import type { OnboardingFlags } from '@repositories/settings';
import type { ExerciseCommand } from '@state/useExerciseCommand';

/** An edit from a card's `⋯` that carries over to later weeks — and has a card left to ring. */
const CARRIED_COMMANDS: ReadonlySet<ExerciseCommand> = new Set([
  'addSet',
  'removeLastSet',
  'addRound',
  'removeLastRound',
  'moveUp',
  'moveDown',
]);

/** Whether this `⋯` command is one the edit coachmark is about. Skip, Unskip and Delete are not. */
export function isCarriedCommand(command: ExerciseCommand): boolean {
  return CARRIED_COMMANDS.has(command);
}

/**
 * Whether the edit coachmark may show (GT-224): once per install, after the Welcome dialog, on a live
 * working session that has a working week after it. `lastWorkingWeek` is the block's last week
 * before its deload; `undefined` while the block is still being read — nothing shows then.
 */
export function shouldShowEditCoachmark(
  flags: OnboardingFlags | undefined,
  session: { mode: WorkoutMode; isDeload: boolean; weekNumber: number } | undefined,
  lastWorkingWeek: number | undefined,
): boolean {
  return (
    flags !== undefined &&
    flags.welcomeSeen &&
    !flags.editCoachmarkSeen &&
    session !== undefined &&
    session.mode === 'live' &&
    !session.isDeload &&
    lastWorkingWeek !== undefined &&
    session.weekNumber < lastWorkingWeek
  );
}

/** The block's last week before the deload — its last week, if it has none. */
export function lastWorkingWeekOf(
  weeks: readonly { weekNumber: number; isDeload: boolean }[],
): number {
  const deload = weeks.find((week) => week.isDeload);
  return deload !== undefined ? deload.weekNumber - 1 : weeks.length;
}

export const EDIT_COACHMARK: BadgeExplanation = {
  title: 'This change affects future workouts',
  rows: [
    {
      icon: ArrowRightIcon,
      text: [{ strong: 'Add, remove, replace or move:' }, ' carried over to future weeks.'],
    },
    { icon: SkipIcon, text: [{ strong: 'Skip:' }, ' affects only this workout.'] },
  ],
};
