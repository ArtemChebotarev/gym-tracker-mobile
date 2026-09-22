// Pure helpers behind components/WorkoutExerciseCard.tsx — see the code-style skill.

import type { Equipment } from '@domain/catalog';
import type { WorkoutMode } from '@domain/workoutView';
import type { ExerciseWeightHint } from '@domain/workoutViewRules';
import type { WeightRange, WeightSwapTarget } from '@domain/weightSwap';
import { formatRir } from '@design/formatRir';
import type { WorkoutExercise, WorkoutSetRow } from '@usecases/workoutSession';

import { formatRowWeight, initialWeightText, parseWeight, rowEvaluation } from './WorkoutSetRowLogic';

/**
 * What a card shows (08.7, "Карточка упражнения"). The four variants come from the screen mode
 * plus the exercise's own status:
 * - live — everything, including `⋯`;
 * - read-only — no `⋯`;
 * - skipped (either mode) — the card at 50% opacity. With sets logged, every row shows: the logged
 *   ones as usual, the rest as `Skipped` rows. With nothing logged, one `Skipped` line in place of
 *   the rows;
 * - preview — no RIR badge, no set rows, the `Not programmed yet` plate instead.
 * The history button is there in every variant.
 */
export type ExerciseCardView = {
  showMenu: boolean;
  /** `2 RIR`, or `undefined` when the badge isn't shown. */
  rirLabel: string | undefined;
  isSkipped: boolean;
  /** The column header and set rows — everything but preview and a skipped card with nothing logged. */
  showSets: boolean;
  /** Skipped with nothing logged: one `Skipped` line instead of the rows. */
  showSkippedNote: boolean;
  showNotProgrammed: boolean;
};

export function exerciseCardView(
  mode: WorkoutMode,
  exercise: Pick<WorkoutExercise, 'status' | 'targetRir' | 'rows'>,
): ExerciseCardView {
  const isPreview = mode === 'preview';
  const isSkipped = !isPreview && exercise.status === 'skipped';
  const skippedWhole = isSkipped && exercise.rows.every((row) => row.isSkipped === true);
  return {
    showMenu: mode === 'live',
    rirLabel:
      !isPreview && exercise.targetRir !== undefined ? formatRir(exercise.targetRir) : undefined,
    isSkipped,
    showSets: !isPreview && !skippedWhole && exercise.rows.length > 0,
    showSkippedNote: skippedWhole,
    showNotProgrammed: isPreview,
  };
}

/**
 * The group chip sits above a card only when its muscle group differs from the previous card's
 * (08.7, "Список упражнений") — so the first card always gets one.
 */
export function showsGroupChip(
  exercises: readonly Pick<WorkoutExercise, 'muscleGroup'>[],
  index: number,
): boolean {
  const current = exercises[index];
  if (current === undefined) {
    return false;
  }
  return index === 0 || exercises[index - 1]?.muscleGroup !== current.muscleGroup;
}

/** The card's weight hint line: `Go heavier — 30+ reps last week` / `Go lighter — under 5 reps…`. */
export function formatWeightHint(hint: ExerciseWeightHint): string {
  return hint.direction === 'increase'
    ? `Go heavier — ${hint.reps}+ reps last week`
    : `Go lighter — under ${hint.reps} reps last week`;
}

/**
 * One Weight field of an exercise while nothing has been logged from it yet (task 106).
 * `isManual` marks a value the user put there themselves — by typing, or by un-logging a set, which
 * brings the logged weight back. Carry-over leaves those alone and only replaces what it or
 * `suggestedWeight` had supplied.
 */
export type WeightField = {
  text: string;
  isManual: boolean;
};

/**
 * What the exercise's Weight fields hold, keyed by set number. A set with no entry hasn't been
 * touched: its field shows its own `suggestedWeight` (`weightFieldText`) and carry-over may replace
 * it. Typed-but-unlogged values are never saved (05, "Сохранение данных") — this lives in the card
 * for as long as it's mounted, and a replaced exercise starts over with empty edits.
 */
export type WeightEdits = Readonly<Record<number, WeightField>>;

/**
 * The text a row's Weight field shows: the edit made to it, else what the row starts with —
 * its suggested weight, or the block's body weight on a pure bodyweight exercise (task 105).
 */
export function weightFieldText(
  edits: WeightEdits,
  row: Pick<WorkoutSetRow, 'setNumber' | 'suggestedWeight'>,
  equipment?: Equipment,
  bodyWeight?: number,
): string {
  return edits[row.setNumber]?.text ?? initialWeightText(row, equipment, bodyWeight);
}

/** Typing in a Weight field — the value becomes the user's own, so later carry-overs skip it. */
export function editWeightText(edits: WeightEdits, setNumber: number, text: string): WeightEdits {
  return { ...edits, [setNumber]: { text, isManual: true } };
}

/**
 * Un-logging a set brings the logged weight back into its field (05, "Снять отметку") — as a value
 * the user stands behind, so carry-over won't overwrite it either.
 */
export function holdLoggedWeight(
  edits: WeightEdits,
  setNumber: number,
  weight: number,
): WeightEdits {
  return { ...edits, [setNumber]: { text: formatRowWeight(weight), isManual: true } };
}

/**
 * The weight entered in one set carries into the rest of the exercise (task 106): when the cursor
 * leaves a Weight field the user typed in, its text fills every **later** set that is still
 * unlogged and still holds what `suggestedWeight` or an earlier carry-over put there. Logged sets
 * never change ("История неизменяема"), and neither does a field the user typed in themselves —
 * correcting set 2 leaves a set 3 you already set by hand alone.
 *
 * Leaving a field nobody typed in changes nothing, so tabbing through the rows carries nothing.
 */
export function carryWeightForward(
  edits: WeightEdits,
  rows: readonly Pick<WorkoutSetRow, 'setNumber' | 'suggestedWeight' | 'log'>[],
  setNumber: number,
): WeightEdits {
  const index = rows.findIndex((row) => row.setNumber === setNumber);
  if (index === -1 || edits[setNumber]?.isManual !== true) {
    return edits;
  }
  const { text } = edits[setNumber];
  const carried: Record<number, WeightField> = {};
  for (const row of rows.slice(index + 1)) {
    if (row.log === undefined && edits[row.setNumber]?.isManual !== true) {
      carried[row.setNumber] = { text, isManual: false };
    }
  }
  return { ...edits, ...carried };
}

// ---------------------------------------------------------------------------------------------
// Weight swap — 08.7.1 · Другой вес. Everything below reads what `evaluateWeightSwap` and the
// row's own `weightSwap` already worked out (03, rule 7; task 120) and turns it into the strings
// and spans the ⓘ popover and the card's InlineNote show. Nothing here computes reps or ranges.

/** The set the ⓘ and the note speak for: the one whose Log box carries the accent. */
export function firstUnloggedRow(
  rows: readonly WorkoutSetRow[],
): WorkoutSetRow | undefined {
  return rows.find((row) => row.isFirstUnlogged);
}

/** A weight as the swap states it — the added weight on a weighted bodyweight exercise. */
function formatSwapWeight(weight: number, added: boolean): string {
  return added ? `+${formatRowWeight(weight)}` : formatRowWeight(weight);
}

function formatSwapSpans(spans: readonly WeightRange[], added: boolean): string {
  const parts = spans.map((span) =>
    added
      ? `${formatSwapWeight(span.min, true)} to ${formatSwapWeight(span.max, true)}`
      : `${formatRowWeight(span.min)}–${formatRowWeight(span.max)}`,
  );
  return `${parts.join(' and ')} kg`;
}

/** `15 kg × 10`, or `+16 kg × 7` on a weighted bodyweight exercise. */
function formatSwapTarget(swap: WeightSwapTarget): string {
  const added = swap.bodyWeight !== undefined;
  return `${formatSwapWeight(targetWeightOf(swap), added)} kg × ${swap.baseReps}`;
}

/**
 * The target's weight in the units the set row types in: the added weight on a weighted bodyweight
 * exercise, where `baseWeight` is the full load the formula works on (03, rule 7).
 */
function targetWeightOf(swap: WeightSwapTarget): number {
  return swap.bodyWeight === undefined ? swap.baseWeight : swap.baseWeight - swap.bodyWeight;
}

/** The parts of the full span that lie outside the close one — one side, or both. */
function estimateSpans(swap: WeightSwapTarget): WeightRange[] {
  const spans: WeightRange[] = [];
  if (swap.estimateRange.min < swap.closeRange.min) {
    spans.push({ min: swap.estimateRange.min, max: swap.closeRange.min });
  }
  if (swap.closeRange.max < swap.estimateRange.max) {
    spans.push({ min: swap.closeRange.max, max: swap.estimateRange.max });
  }
  return spans;
}

/**
 * How close two labels may sit, as a share of the track, before they run into each other. Not a
 * design value — it is about the numbers, not about how they are drawn.
 */
const LABEL_CLEARANCE = 0.08;

/**
 * The values the track is labelled at: its four bounds, each once, plus the target — unless the
 * target sits so near a bound that the two would collide. The dot marks it either way, and the
 * popover's subtitle spells it out, so the bound is the one worth keeping.
 */
function trackLabels(swap: WeightSwapTarget, marker: number): number[] {
  const bounds = [
    swap.estimateRange.min,
    swap.closeRange.min,
    swap.closeRange.max,
    swap.estimateRange.max,
  ];
  const span = swap.estimateRange.max - swap.estimateRange.min;
  const crowded =
    span > 0 && bounds.some((bound) => Math.abs(bound - marker) / span < LABEL_CLEARANCE);
  return [...new Set(crowded ? bounds : [...bounds, marker])].sort((a, b) => a - b);
}

export type WeightSwapLegendRow = {
  /** Which span of the track the line names — it carries that span's own swatch. */
  span: 'inner' | 'outer';
  label: string;
  value: string;
};

/**
 * What the ⓘ popover shows for the exercise's first unlogged set — always from that set's
 * **original** target, never from whatever weight is in the field right now (08.7.1).
 */
export type WeightSwapPopover =
  | {
      kind: 'ranges';
      title: string;
      subtitle: string;
      outer: WeightRange;
      inner: WeightRange;
      marker: number;
      labels: { value: number; text: string }[];
      legend: WeightSwapLegendRow[];
      footer: string;
    }
  | { kind: 'no-history'; title: string; text: string };

export function weightSwapPopover(
  row: Pick<WorkoutSetRow, 'setNumber' | 'weightSwap'> | undefined,
  targetRir: number | undefined,
): WeightSwapPopover | undefined {
  if (row === undefined || row.weightSwap === undefined) {
    return undefined;
  }
  const swap = row.weightSwap;
  if ('unavailable' in swap) {
    const effort = targetRir === undefined ? 'a few reps' : `about ${targetRir} reps`;
    return {
      kind: 'no-history',
      title: 'Not enough history yet',
      text: `Pick a weight you can lift for ${effort} short of failure. After this workout you’ll get rep targets, and any weight you pick will get its own.`,
    };
  }
  const added = swap.bodyWeight !== undefined;
  const marker = targetWeightOf(swap);
  const spans = estimateSpans(swap);
  const legend: WeightSwapLegendRow[] = [
    { span: 'inner', label: 'Recommended weight', value: formatSwapSpans([swap.closeRange], added) },
  ];
  if (spans.length > 0) {
    legend.push({
      span: 'outer',
      label: 'Not ideal, but acceptable',
      value: formatSwapSpans(spans, added),
    });
  }
  return {
    kind: 'ranges',
    title: 'Weight recommendations',
    subtitle: `Set ${row.setNumber} · target ${formatSwapTarget(swap)}`,
    outer: swap.estimateRange,
    inner: swap.closeRange,
    marker,
    labels: trackLabels(swap, marker).map((value) => ({
      value,
      text: formatSwapWeight(value, added),
    })),
    legend,
    footer: 'Type the weight you have — reps update in every set.',
  };
}

/** The card's one InlineNote (08.7.1) — the lead phrase, then the way out of it. */
export type WeightSwapNote = { lead: string; text: string };

/**
 * The note under the set rows: it speaks for the first unlogged set, and only while the weight in
 * its field has taken the target out of reach — an `estimate`, or off the rep corridor entirely.
 * A close weight needs no explaining, and neither does a card with nothing typed into it.
 */
export function weightSwapNote(
  row: Pick<WorkoutSetRow, 'weightSwap'> | undefined,
  weightText: string,
  targetRir: number | undefined,
): WeightSwapNote | undefined {
  if (row === undefined || row.weightSwap === undefined || 'unavailable' in row.weightSwap) {
    return undefined;
  }
  const swap = row.weightSwap;
  const evaluation = rowEvaluation(row, weightText);
  if (evaluation === undefined) {
    return undefined;
  }
  const added = swap.bodyWeight !== undefined;
  if (evaluation.zone === 'out') {
    const weight = formatSwapWeight(parseWeight(weightText) ?? 0, added);
    const bound = formatSwapWeight(evaluation.bound, added);
    return evaluation.direction === 'tooHeavy'
      ? {
          lead: `${weight} kg is too heavy for ${swap.corridor.minReps}+ reps.`,
          text: `Up to ${bound} kg keeps a rep target.`,
        }
      : {
          lead: `${weight} kg is too light for ${swap.corridor.maxReps} reps.`,
          text: `From ${bound} kg keeps a rep target.`,
        };
  }
  if (evaluation.zone !== 'estimate') {
    // `target` and `close` read as an ordinary target — there is nothing to explain.
    return undefined;
  }
  const effort = targetRir === undefined ? 'the effort' : formatRir(targetRir);
  return {
    lead: `~ Estimated from ${formatSwapTarget(swap)}.`,
    text: `Stop at ${effort}, not at the number.`,
  };
}
