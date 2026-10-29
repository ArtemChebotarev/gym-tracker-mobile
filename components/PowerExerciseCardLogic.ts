// Pure helpers behind components/PowerExerciseCard.tsx (10.2) — see the code-style skill.

import type { PowerLoad } from '@domain/exerciseConfig';
import type { CeilingOption, PowerCeilingHint } from '@domain/powerCeilingHint';
import { POWER_MAX_REPS } from '@domain/progressionCorridor';
import type { WorkoutSetRow } from '@usecases/workoutSession';

import { powerNoHeavierLabel } from './ExerciseFormLogic';

/** The Load column's header (10.1 FR-2, GT-82): what the load is — kilograms, a level, or the body. */
export function powerLoadColumnLabel(load: PowerLoad): string {
  switch (load) {
    case 'level':
      return 'Level';
    case 'none':
      return 'Bodyweight, kg';
    case 'weight':
      return 'Load, kg';
  }
}

/** The mark the note leads with: the load going up, a variation swap, or one more set. */
export type CeilingNoteIcon = 'up' | 'swap' | 'plus';

/**
 * The card's note at the top of the corridor — power only (10.2 P6–P9, GT-81), in the shape of the
 * mockup: the step to take, then what happened last week, then the actions the note leads to.
 */
export type CeilingNote = {
  icon: CeilingNoteIcon;
  lead: string;
  text: string;
  /** "No heavier available": the user says there is no heavier load to take. */
  flagLabel?: string;
  /** "Replace exercise": opens the replace flow once the load option is a harder variation. */
  replaceLabel?: string;
  /** "Hide this tip": closes the note for good — offered with the harder variation. */
  hideLabel?: string;
};

const CEILING_OPTION_TEXT: Record<CeilingOption, string> = {
  heavier: 'try heavier',
  'higher-level': 'try a higher level',
  'harder-variation': 'try a harder variation',
  'add-set': 'add a set',
};

/** What the note says about the load the exercise is at: the kilograms, or that it is a level. */
export type CeilingNoteContext = {
  load: PowerLoad;
  /** The heaviest weight in the exercise's rows, for "10 kg is the heaviest you have". */
  topWeight?: number;
};

/**
 * The top of the corridor is explained once, in the Fast reps ⓘ, so the note doesn't repeat why: it
 * says what to do ("Try heavier or add a set."), what the user did ("You did 6+ fast reps on every
 * set last week."), and — once nothing heavier is left — that they may stay where they are. The
 * actions are links under it.
 */
export function formatCeilingNote(
  hint: PowerCeilingHint,
  context: CeilingNoteContext,
): CeilingNote {
  const [first, ...rest] = hint.options;
  const steps = hint.options.map((option) => CEILING_OPTION_TEXT[option]);
  const sentence = steps.join(' or ');
  const lead = `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
  const didReps = `You did ${POWER_MAX_REPS}+ fast reps on every set last week. That's the top of the recommended range.`;
  const isVariation = first === 'harder-variation';
  const heaviest =
    context.load === 'level'
      ? 'This is the highest level you have.'
      : context.topWeight === undefined
        ? 'This is the heaviest you have.'
        : `${context.topWeight} kg is the heaviest you have.`;
  const icon: CeilingNoteIcon = isVariation
    ? 'swap'
    : first === undefined || (rest.length === 0 && first === 'add-set')
      ? 'plus'
      : 'up';
  return {
    icon,
    lead,
    text: isVariation ? `${heaviest} Or keep it here while your strength catches up.` : didReps,
    ...(hint.canFlagNoHeavier ? { flagLabel: powerNoHeavierLabel(context.load) } : {}),
    ...(isVariation ? { replaceLabel: 'Replace exercise' } : {}),
    ...(hint.canHideTip ? { hideLabel: 'Hide this tip' } : {}),
  };
}

/** The heaviest weight among the rows, as an object to spread — nothing when no row has one. */
export function topWeightOf(rows: readonly Pick<WorkoutSetRow, 'suggestedWeight'>[]): {
  topWeight?: number;
} {
  const weights = rows.flatMap((row) =>
    row.suggestedWeight === undefined ? [] : [row.suggestedWeight],
  );
  return weights.length === 0 ? {} : { topWeight: Math.max(...weights) };
}
