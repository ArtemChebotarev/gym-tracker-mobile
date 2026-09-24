// Pure helpers behind components/MesoSourceWeekStep.tsx — see the code-style skill and
// 08.8 · Редактор мезоцикла — Flow C, "Шаг S — Source week".

import type { DropdownOption } from '@design/components/Dropdown';
import type { Mesocycle } from '@domain/mesocycle';
import type { SourceWeekOption } from '@domain/sourceWeek';

/**
 * The line under the `Week` field. It carries the one rule this step doesn't show — that a deload
 * week is never among the options — because the alternative was a row that sits there greyed out
 * explaining itself (08.8, "Поведение"; decided 23.09.2026). It also says the field is already
 * answered, which is the point of the defaults: the ordinary way through this step is one tap on
 * Continue.
 */
export const SOURCE_WEEK_HINT =
  "Defaults to your last working week — deload weeks aren't included. Change it if this isn't the one.";

/**
 * What the step says instead of its fields when the chosen block has no week to copy. Reachable
 * only through a block that was stopped during its first week — every other finished block has at
 * least one working week with sessions behind it — so it is an explanation, not a dead end: the
 * other blocks are still in the dropdown above it.
 */
export const NO_SOURCE_WEEKS_HINT =
  'This mesocycle has no week to copy — nothing was trained outside its deload week.';

/** Options for the mesocycle dropdown, in the order given — newest-finished first (08.3's own). */
export function toMesocycleOptions(mesocycles: readonly Mesocycle[]): DropdownOption[] {
  return mesocycles.map((mesocycle) => ({ value: mesocycle.id, label: mesocycle.name }));
}

/**
 * Options for the week dropdown: `Week 3 · 2 of 4 workouts`. A Dropdown row is one line, so the
 * week and what is in it share it — the `M of K workouts` the spec puts under `Week N` (08.8).
 *
 * `M` may be 0, and the week is offered all the same: what is copied is structure, and an
 * untrained week has as much of it as a trained one (04, "Незавершённые недели"). Saying `0 of 4
 * workouts` outright is the honest version of that — it is the one thing that tells these weeks
 * apart, and hiding it would make the default look arbitrary.
 */
export function toWeekOptions(weeks: readonly SourceWeekOption[]): DropdownOption[] {
  return weeks.map((week) => ({
    value: String(week.weekNumber),
    label: `Week ${week.weekNumber} · ${formatWeekWorkouts(week)}`,
  }));
}

/** `2 of 4 workouts`, singular at one. */
export function formatWeekWorkouts(week: SourceWeekOption): string {
  const workouts = week.sessionCount === 1 ? 'workout' : 'workouts';
  return `${week.completedCount} of ${week.sessionCount} ${workouts}`;
}

/**
 * Identifies a source selection, for telling "the user came back to this step and changed
 * something" from "they came back and pressed Continue again".
 *
 * The editor prefills its draft from the source week, which overwrites whatever was edited on
 * steps 1–2. Doing that on every Continue would throw away work for anyone who stepped back to
 * check which week they had picked; never doing it would leave a changed selection with no
 * effect. Comparing the selection with the one already copied in separates the two.
 */
export function sourceWeekKey(mesoId: string, weekNumber: number): string {
  return `${mesoId}:${weekNumber}`;
}
