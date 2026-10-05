// MesoTemplate -> editor draft — Flow B's starting point (04 · Meso Creation Flows, "Правила
// Flow B"; task GT-9). Kept apart from `domain/plan.ts` (types only) per the single-responsibility
// rule in AGENTS.md, and from `domain/planConverters.ts`, which converts a `WeekPlan` to and from
// sessions rather than out of a template.

import type { Exercise } from '@domain/catalog';
import type { Mesocycle } from '@domain/mesocycle';
import { isArchivedMesocycle } from '@domain/mesocycleLifecycle';
import { firstFreeName } from '@domain/names';
import type { MesoTemplate, WeekPlan, WeekPlanExercise } from '@domain/plan';
import { renumbered } from '@domain/sessionExerciseOrder';

/**
 * What a template fills the editor with. Length is not among it: a template has none (02 · Domain
 * Model, `MesoTemplate`), so the editor starts from the same default as Flow A.
 */
export type TemplateDraft = {
  name: string;
  daysPerWeek: number;
  weekPlan: WeekPlan;
  /** Recorded on the saved mesocycle as `origin: { type: 'template', templateId }`. */
  templateId: string;
};

/**
 * The exercise to put in the draft for a template's suggestion, or `undefined` to drop the row.
 *
 * A visible suggestion stays. A hidden one is replaced by the first visible catalog exercise of
 * its muscle group — first in the order `exercises` lists them, which is the catalog's own — and
 * dropped if its group has none. An id the library doesn't know is dropped too: a template must
 * never put a dangling exercise into a mesocycle (04, "Проверка шаблона").
 */
function resolveSuggestion(exerciseId: string, exercises: readonly Exercise[]): string | undefined {
  const suggested = exercises.find((exercise) => exercise.id === exerciseId);
  if (!suggested) {
    return undefined;
  }
  if (!suggested.isHidden) {
    return suggested.id;
  }
  return exercises.find(
    (exercise) =>
      exercise.source === 'catalog' &&
      !exercise.isHidden &&
      exercise.muscleGroup === suggested.muscleGroup,
  )?.id;
}

/**
 * Applies `template` to a new editor draft (04 · Meso Creation Flows, "Правила Flow B"). Pure.
 *
 * - The week plan is a deep copy: editing the draft never reaches the template, and changing the
 *   template later never reaches a mesocycle made from it.
 * - The name is the template's, with the first free ` 2`, ` 3`, … if a mesocycle already has it.
 *   Archived mesocycles don't count — they are out of sight, and a `Push 2` next to no `Push`
 *   would read as a mistake.
 * - Days keep their number and `sets`, and lose their names: days are `Day 1…N` in every flow.
 * - Hidden suggestions are replaced or dropped (`resolveSuggestion`), and each day's `order` is
 *   renumbered 1..n over what is left. A day left empty stays in the plan — the user fills it in,
 *   as in Flow A.
 *
 * `exercises` is the whole library, hidden ones included (`ExerciseRepository.getAll`): a hidden
 * suggestion's muscle group is read from it.
 */
export function applyTemplate(
  template: MesoTemplate,
  exercises: readonly Exercise[],
  mesocycles: readonly Pick<Mesocycle, 'name' | 'archivedAt'>[],
): TemplateDraft {
  const days = [...template.weekPlan.days]
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((day, index) => ({
      dayNumber: index + 1,
      name: '',
      exercises: renumbered(
        day.exercises.flatMap((exercise): WeekPlanExercise[] => {
          const exerciseId = resolveSuggestion(exercise.exerciseId, exercises);
          return exerciseId === undefined
            ? []
            : [{ exerciseId, order: exercise.order, sets: exercise.sets }];
        }),
      ),
    }));

  return {
    name: firstFreeName(
      template.name,
      mesocycles.filter((mesocycle) => !isArchivedMesocycle(mesocycle)).map(({ name }) => name),
    ),
    daysPerWeek: days.length,
    weekPlan: { days },
    templateId: template.id,
  };
}
