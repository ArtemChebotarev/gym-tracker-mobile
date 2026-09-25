// Pure helpers behind components/WorkoutScreen.tsx — see the code-style skill.

import { formatWeekdayDate } from '@design/formatDate';
import type { WorkoutMode } from '@domain/workoutView';
import type { WorkoutHeader, WorkoutSessionModel } from '@usecases/workoutSession';

/**
 * Whether the header carries the grid button and the `⋯` menu (08.9, "History-режим экрана
 * тренировки"): every mode but history. A block that has ended keeps its grid and its actions on
 * its own detail screen, which is where a history session is opened from — putting them here too
 * would only lead back to the screen the user just came off.
 */
export function showsHeaderActions(mode: WorkoutMode): boolean {
  return mode !== 'history';
}

/**
 * The line under the title (08.7, "Шапка"): `Tue, 15 Sep · Upper/lower` — the session's date, then
 * the mesocycle name. A session that hasn't started has no date, so only the name shows.
 */
export function formatWorkoutSubtitle(
  header: Pick<WorkoutHeader, 'date' | 'mesocycleName'>,
): string {
  if (header.date === undefined) {
    return header.mesocycleName;
  }
  return `${formatWeekdayDate(new Date(header.date))} · ${header.mesocycleName}`;
}

/** The caption under a preview's list (08.7, "Preview непосчитанного дня"). */
export function formatUnlocksCaption(
  unlocksAfter: NonNullable<WorkoutSessionModel['unlocksAfter']>,
): string {
  return `Unlocks when you finish Week ${unlocksAfter.weekNumber} Day ${unlocksAfter.dayNumber}`;
}
