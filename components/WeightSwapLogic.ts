// Weight swap — 08.7.1 · Другой вес. Everything here reads what `evaluateWeightSwap` and the
// row's own `weightSwap` already worked out (03, rule 7; task 120) and turns it into the strings
// and spans the ⓘ popover and the card's InlineNote show. Nothing here computes reps or ranges.
// The ⓘ beside Reps on a strength card opens the popover; the note sits under the set rows
// (WorkoutSetRows), so a power card — which has no swap — never gets either. See the code-style
// skill.

import type { PlateTextPart } from '@design/components/PlateRow';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { WeightRange, WeightSwapTarget } from '@domain/weightSwap';
import { formatRir } from '@design/formatRir';
import type { WorkoutSetRow } from '@usecases/workoutSession';

import { type CorridorStepsPlate, repCorridorTrack } from './CorridorStepsPlateLogic';
import { formatRowWeight, parseWeight, rowEvaluation } from './WorkoutSetRowLogic';

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
    }
  | ({ kind: 'no-history' } & CorridorStepsPlate);

export function weightSwapPopover(
  row: Pick<WorkoutSetRow, 'setNumber' | 'weightSwap' | 'estimate'> | undefined,
  targetRir: number | undefined,
): WeightSwapPopover | undefined {
  if (row === undefined || row.weightSwap === undefined) {
    return undefined;
  }
  const swap = row.weightSwap;
  if ('unavailable' in swap) {
    // How hard to take the set: the reserve the week asks for, and at the last week's 0 RIR there
    // is none to name — it is failure.
    const effortStep: PlateTextPart[] =
      targetRir === 0
        ? ['Take each set ', { strong: 'to failure' }, '.']
        : [
            'Stop each set with ',
            {
              strong: `${targetRir === undefined ? 'a few reps' : `about ${targetRir} ${targetRir === 1 ? 'rep' : 'reps'}`} in reserve`,
            },
            '.',
          ];
    // Four steps rather than a paragraph (08.11, Artem's wording of the last): the weight to pick
    // and the corridor a set has to land in — the engine builds its rep targets and weight ranges
    // on it (03) — how hard to take it, then what the app does for you next time.
    const { minReps, maxReps } = defaultProgressionSettings;
    return {
      kind: 'no-history',
      title: 'Not enough history yet',
      corridor: repCorridorTrack(minReps, maxReps, `Reps per set: ${minReps} to ${maxReps}`),
      steps: [
        ['Pick a weight you can lift for ', { strong: `${minReps}–${maxReps} reps` }, '.'],
        effortStep,
        ['Log this workout.'],
        ['Next time: ', { strong: 'reps will be calculated' }, ' for you.'],
      ],
    };
  }
  const added = swap.bodyWeight !== undefined;
  const marker = targetWeightOf(swap);
  const spans = estimateSpans(swap);
  const legend: WeightSwapLegendRow[] = [
    {
      span: 'inner',
      label: 'Recommended weight',
      value: formatSwapSpans([swap.closeRange], added),
    },
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
    // The target leads and the instruction sits under it: the number you are anchored to is what
    // you scan first, and the line under it says what may be done about it. The instruction is
    // the whole of it, so the plate needs no closing line (Artem's wording).
    // An estimate (task 134.1) says so here too: it is what the ranges are worked out from.
    title: `Current set ${row.estimate === undefined ? 'target' : 'estimate'}: ${formatSwapTarget(swap)}`,
    subtitle: 'Pick another weight and the reps update.',
    outer: swap.estimateRange,
    inner: swap.closeRange,
    marker,
    labels: trackLabels(swap, marker).map((value) => ({
      value,
      text: formatSwapWeight(value, added),
    })),
    legend,
  };
}

/** The card's one InlineNote (08.7.1) — the lead phrase, then the way out of it. */
export type EstimateNote = { lead: string; text: string };

/**
 * The note under the set rows. It speaks for the first unlogged set, and only while that set's
 * numbers aren't a target to hit — by reason (03, "Оценка"):
 *
 * - the weight in its field has taken the target out of reach (rule 7, 08.7.1) — an `estimate`,
 *   or off the rep corridor entirely. That one comes first: it is about the weight in hand now;
 * - the set's own numbers are an estimate from another day or block (`other_slot`, task 134.1).
 *
 * A close weight on an ordinary target needs no explaining, and neither does a card with nothing
 * typed into it.
 */
export function estimateNote(
  row: Pick<WorkoutSetRow, 'weightSwap' | 'estimate'> | undefined,
  weightText: string,
  targetRir: number | undefined,
): EstimateNote | undefined {
  if (row === undefined) {
    return undefined;
  }
  const effort = targetRir === undefined ? 'the effort' : formatRir(targetRir);
  const otherWeight = otherWeightNote(row, weightText, effort);
  if (otherWeight !== undefined) {
    return otherWeight;
  }
  if (row.estimate === 'other_slot') {
    // Artem's wording: where the number comes from, and what to go by instead.
    return {
      lead: 'Approximate estimation based on your previous activity.',
      text: `Stop at ${effort}.`,
    };
  }
  return undefined;
}

/** Rule 7's half of `estimateNote` — the weight in the field against the set's own numbers. */
function otherWeightNote(
  row: Pick<WorkoutSetRow, 'weightSwap'>,
  weightText: string,
  effort: string,
): EstimateNote | undefined {
  if (row.weightSwap === undefined || 'unavailable' in row.weightSwap) {
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
    // `target` and `close` read as the set's own numbers — there is nothing to explain.
    return undefined;
  }
  return {
    lead: `~ Estimated from ${formatSwapTarget(swap)}.`,
    text: `Stop at ${effort}, not at the number.`,
  };
}
