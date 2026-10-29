// Pure helpers every exercise card shares — components/WorkoutExerciseCard.tsx and the cards it
// picks, ExerciseCardFrame among them. A type's own words live in its card's Logic file
// (StrengthExerciseCardLogic.ts, PowerExerciseCardLogic.ts); the set rows' in WorkoutSetRowsLogic.ts
// and the weight swap's in WeightSwapLogic.ts. See the code-style skill.

import { isResistanceBand } from '@domain/bodyWeightLoad';
import type { Equipment, ExerciseType, MuscleGroup } from '@domain/catalog';
import type { SessionExerciseStatus } from '@domain/execution';
import { isNotDone, type NotDoneStatus } from '@domain/sessionExerciseStatus';
import type { WorkoutMode } from '@domain/workoutView';
import { formatRir } from '@design/formatRir';
import type { WorkoutExercise, WorkoutSetRow } from '@usecases/workoutSession';

import { showsFirstWeightInfo } from './FirstWeightPopoverLogic';
import { weightSwapPopover } from './WeightSwapLogic';
import { formatNotDone } from './WorkoutSetRowLogic';

/**
 * What a card shows (08.7, "Карточка упражнения"). The four variants come from the screen mode
 * plus the exercise's own status:
 * - live — everything, including `⋯`;
 * - read-only, and history with it (08.9) — no `⋯`. A card reads the same in both: history takes
 *   things off the header, not off the cards;
 * - skipped or abandoned (either mode) — the card at 50% opacity. With sets logged, every row
 *   shows: the logged ones as usual, the rest as `Skipped` rows — `Abandoned` for an exercise Stop
 *   mesocycle closed (136). With nothing logged, one such line in place of the rows;
 * - preview — no RIR badge, no set rows, the `Not programmed yet` plate instead.
 * The history button is there in every variant.
 */
export type ExerciseCardView = {
  showMenu: boolean;
  /** `2 RIR`, or `undefined` when the badge isn't shown — and on a deload week, which has its own. */
  rirLabel: string | undefined;
  /** `Deload` on a deload week, in the RIR badge's place, for every type of exercise. */
  deloadLabel: string | undefined;
  /** Skipped or abandoned: the card is dimmed and nothing in it is editable. */
  isNotDone: boolean;
  /**
   * The column header and the type's rows (sets, rounds) — everything but preview and a not-done
   * card with nothing logged.
   */
  showRows: boolean;
  /** Not done with nothing logged: this one line (`Skipped` / `Abandoned`) instead of the rows. */
  notDoneNote: string | undefined;
  showNotProgrammed: boolean;
};

/**
 * What `exerciseCardView` needs of a card's rows, whatever they are — set rows, rounds: how many
 * there are, and whether every one of them is closed unlogged (`Skipped` / `Abandoned`).
 */
export type CardRows = { count: number; allNotDone: boolean };

export function cardRowsOf(rows: readonly { notDone?: NotDoneStatus }[]): CardRows {
  return {
    count: rows.length,
    allNotDone: rows.every((row) => row.notDone !== undefined),
  };
}

/**
 * The set rows of a card made of them — strength and power — or `undefined` for a type whose card
 * has none. The one place that says which cards have sets, so nothing shared has to assume it.
 */
export function setRowsOf(exercise: WorkoutExercise): readonly WorkoutSetRow[] | undefined {
  return 'rows' in exercise ? exercise.rows : undefined;
}

export function exerciseCardView(
  mode: WorkoutMode,
  exercise: { status: SessionExerciseStatus; targetRir?: number | undefined },
  rows: CardRows,
  isDeload = false,
): ExerciseCardView {
  const isPreview = mode === 'preview';
  const notDone = !isPreview && isNotDone(exercise.status) ? exercise.status : undefined;
  const notDoneWhole = notDone !== undefined && rows.allNotDone;
  return {
    showMenu: mode === 'live',
    rirLabel:
      !isPreview && !isDeload && exercise.targetRir !== undefined
        ? formatRir(exercise.targetRir)
        : undefined,
    deloadLabel: !isPreview && isDeload ? 'Deload' : undefined,
    isNotDone: notDone !== undefined,
    showRows: !isPreview && !notDoneWhole && rows.count > 0,
    notDoneNote: notDoneWhole ? formatNotDone(notDone) : undefined,
    showNotProgrammed: isPreview,
  };
}

/**
 * The week's target RIR as the card shows it — the `N RIR` badge. A strength exercise's, except on a resistance band: a band isn't dosed precisely
 * enough for a reserve to mean anything (10.1 FR-15). Power has none on screen either (10.2 P5),
 * and an interval or a mobility block none at all.
 * The RIR stays in the data all the same.
 */
export function targetRirOf(exercise: WorkoutExercise): number | undefined {
  return exercise.type === 'power' ||
    exercise.type === 'interval' ||
    exercise.type === 'mobility' ||
    isResistanceBand(exercise.equipment)
    ? undefined
    : exercise.targetRir;
}

/**
 * What the exercise's weight means — the equipment printed under the name, except for a power
 * exercise that is its own load, which weighs what you weigh (`loadEquipmentOf`).
 */
export function cardLoadEquipment(exercise: WorkoutExercise): Equipment | undefined {
  return exercise.type === 'power'
    ? (exercise.loadEquipment ?? exercise.equipment)
    : exercise.equipment;
}

/**
 * The chip above a card: the muscle group for a strength exercise, the exercise's type for any
 * other (10.1 FR-14) — a power card is told apart by "Power", not by the muscle it happens to hit,
 * which is secondary there (Artem, 18.10.2026).
 */
export type CardChip =
  { kind: 'group'; muscleGroup: MuscleGroup } | { kind: 'type'; type: ExerciseType };

/**
 * Which chip, if any, sits above card `index` (08.7, "Список упражнений"): only when what it names
 * changes from the previous card, so the first card always gets one. A strength card names its
 * muscle group, and also when it follows a card of another type — the run of strength starts over.
 * A power, interval or mobility card names its type, once for a run of the same type.
 */
export function cardChip(
  exercises: readonly Pick<WorkoutExercise, 'muscleGroup' | 'type'>[],
  index: number,
): CardChip | undefined {
  const current = exercises[index];
  if (current === undefined) {
    return undefined;
  }
  const type = current.type ?? 'strength';
  const previous = exercises[index - 1];
  const previousType = previous === undefined ? undefined : (previous.type ?? 'strength');
  if (type !== 'strength') {
    return previousType === type ? undefined : { kind: 'type', type };
  }
  const changed =
    previous === undefined ||
    previousType !== 'strength' ||
    previous.muscleGroup !== current.muscleGroup;
  return changed ? { kind: 'group', muscleGroup: current.muscleGroup } : undefined;
}

/** The set the ⓘ and the note speak for: the one whose Log box carries the accent. */
export function firstUnloggedRow(rows: readonly WorkoutSetRow[]): WorkoutSetRow | undefined {
  return rows.find((row) => row.isFirstUnlogged);
}

/**
 * Which of the card's tappable explainers it carries: the `N RIR` badge, the ⓘ beside `Weight, kg`
 * and the one beside `Reps`. The card draws them by this, and the first-workout coachmarks (GT-42)
 * pick their steps by it — so a step can never point at a button that isn't there.
 */
export type CardInfoTargets = { rir: boolean; weight: boolean; reps: boolean };

/**
 * `setRows` is the card's set rows, or `undefined` on a card without them (`setRowsOf`) — which
 * then has neither ⓘ: both are a set row's.
 */
export function cardInfoTargets(
  exercise: {
    status: SessionExerciseStatus;
    targetRir?: number | undefined;
    equipment?: Equipment;
    loadEquipment?: Equipment;
  },
  setRows: readonly WorkoutSetRow[] | undefined,
  mode: WorkoutMode,
  isDeload: boolean,
): CardInfoTargets {
  const view = exerciseCardView(mode, exercise, cardRowsOf(setRows ?? []), isDeload);
  // Both ⓘ sit in the column header, which is only there with the set rows.
  const showsSets = setRows !== undefined && view.showRows;
  return {
    rir: view.rirLabel !== undefined && exercise.targetRir !== undefined,
    weight:
      showsSets &&
      showsFirstWeightInfo(mode, isDeload, exercise.loadEquipment ?? exercise.equipment),
    reps:
      showsSets &&
      mode === 'live' &&
      weightSwapPopover(firstUnloggedRow(setRows), exercise.targetRir) !== undefined,
  };
}
