// Pure helpers for TemplatePreviewSheet.tsx — see AGENTS.md, "Code organization".

import type { Exercise } from '@domain/catalog';
import type { MesoTemplate } from '@domain/plan';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { getCategoryColor, getMuscleGroupCategory } from '@design/muscleGroupColor';
import type { IconComponent } from '@design/icons/IconFrame';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

import { exerciseTypeIcon } from './MesoEditorDaysStepLogic';
import { formatReviewCount } from './MesoEditorReviewStepLogic';

/** One line of a day in the preview: the muscle group up front, the exercise as its suggestion. */
export type TemplatePreviewRow = {
  key: string;
  number: number;
  muscleGroup: string;
  dotColor: string | undefined;
  /** The type's icon in the dot's place, on an exercise with no group colour (GT-157). */
  typeIcon: IconComponent | undefined;
  exerciseName: string;
  /** What the row counts, as Review writes it: sets, an interval's rounds, nothing for mobility. */
  sets: string;
};

/** Day numbers of the template's week, ascending — the tabs over the rows. */
export function templateDayNumbers(template: Pick<MesoTemplate, 'weekPlan'>): number[] {
  return template.weekPlan.days.map((day) => day.dayNumber).sort((a, b) => a - b);
}

/**
 * The rows of day `dayNumber`, in the template's order (08.10, "Лист превью шаблона"). The group
 * is the exercise's own `muscleGroup`, read from `exercises`; a slot whose exercise the library
 * doesn't know has no group to show and is left out — the template couldn't put it in a cycle
 * either (`applyTemplate`). The exercise carries its equipment, as in the library (`Bench Press ·
 * Barbell`): catalog names alone repeat across equipment.
 */
export function buildPreviewRows(
  template: Pick<MesoTemplate, 'weekPlan'>,
  dayNumber: number,
  exercises: readonly Exercise[],
): TemplatePreviewRow[] {
  const day = template.weekPlan.days.find((candidate) => candidate.dayNumber === dayNumber);
  if (!day) {
    return [];
  }
  const byId = new Map(exercises.map((exercise) => [exercise.id as string, exercise]));
  return [...day.exercises]
    .sort((a, b) => a.order - b.order)
    .flatMap((slot) => {
      const exercise = byId.get(slot.exerciseId);
      return exercise ? [{ slot, exercise }] : [];
    })
    .map(({ slot, exercise }, index) => {
      const category = getMuscleGroupCategory(exercise.muscleGroup);
      const exercisesById = { [slot.exerciseId]: exercise };
      return {
        key: `${slot.order}-${slot.exerciseId}`,
        number: index + 1,
        muscleGroup: getMuscleGroupLabel(exercise.muscleGroup),
        dotColor: category ? getCategoryColor(category) : undefined,
        typeIcon: exerciseTypeIcon(exercisesById, slot.exerciseId),
        exerciseName:
          exercise.equipment === undefined
            ? exercise.name
            : `${exercise.name} · ${getEquipmentLabel(exercise.equipment)}`,
        sets: formatReviewCount(exercisesById, slot),
      };
    });
}
