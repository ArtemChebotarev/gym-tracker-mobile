// The set rows of a card whose plan is sets — strength and power (08.7, "Строка подхода"; 10.2).
// One WorkoutSetRow (093) per set, plus the card's one note under them. Their Weight fields are held
// here rather than in each row: a weight typed in one set carries into the exercise's later
// unlogged sets (task 106, `carryWeightForward`). Reps stay in the row — they don't carry.
//
// What differs between the types that use it comes in as props — what the weight means, whether
// the rows are guided, the power floor for a raised weight — so no type is named in here. A type
// whose plan isn't sets (interval rounds, a mobility duration) has rows of its own.

import { useState } from 'react';

import { InlineNote } from '@design/components/InlineNote';
import type { Equipment } from '@domain/catalog';
import { isBodyWeightExercise, isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { WorkoutSetRow as WorkoutSetRowModel } from '@usecases/workoutSession';

import { estimateNote } from './WeightSwapLogic';
import { firstUnloggedRow } from './WorkoutExerciseCardLogic';
import { WorkoutSetRow } from './WorkoutSetRow';
import { parseWeight } from './WorkoutSetRowLogic';
import {
  type WeightEdits,
  carryWeightForward,
  editWeightText,
  holdLoggedWeight,
  weightFieldText,
} from './WorkoutSetRowsLogic';

/** What a card of set rows needs from the screen to log them (strength and power). */
export type SetLoggingProps = {
  /** The block's body weight (task 105) — fills a pure bodyweight row and tops up a weighted one. */
  bodyWeight?: number;
  /**
   * The Weight field of a pure bodyweight exercise *is* the block's body weight, so editing it
   * sets a new one (task 105, Artem's call — there's no separate place to change it).
   */
  onBodyWeightChange?: (bodyWeight: number) => void;
  /** Opens the body weight sheet — the Weight cell asks for it until the block has one (105). */
  onRequestBodyWeight?: () => void;
  onLogSet: (
    setNumber: number,
    entry: { weight: number; reps: number; bodyWeight?: number },
  ) => void;
  onUnlogSet: (setNumber: number) => void;
};

export type WorkoutSetRowsProps = SetLoggingProps & {
  rows: readonly WorkoutSetRowModel[];
  /** The exercise's target RIR — the effort the estimate note asks for. */
  targetRir: number | undefined;
  /**
   * What the weight means — not always the equipment printed under the name: a power exercise that
   * is its own load weighs what you weigh (`loadEquipmentOf`).
   */
  loadEquipment: Equipment | undefined;
  /** No hit indicator, no weight swap (10.2 P11) — see `WorkoutSetRowProps.guided`. */
  guided: boolean;
  /** See `WorkoutSetRowProps.raisedWeightReps`. */
  raisedWeightReps?: number;
  editable: boolean;
  /** A log or un-log is being saved — every Log box waits for it. */
  isSaving: boolean;
};

export function WorkoutSetRows({
  rows,
  targetRir,
  loadEquipment,
  guided,
  raisedWeightReps,
  editable,
  bodyWeight,
  onBodyWeightChange,
  onRequestBodyWeight,
  isSaving,
  onLogSet,
  onUnlogSet,
}: WorkoutSetRowsProps) {
  const [weights, setWeights] = useState<WeightEdits>({});
  const isBodyWeightField = isPureBodyWeight(loadEquipment);
  // Until the block has a body weight, a bodyweight exercise's Weight cell asks for one rather
  // than taking a number: there's nothing meaningful to type there yet (task 105).
  const asksForBodyWeight =
    isBodyWeightExercise(loadEquipment) && bodyWeight === undefined && editable;

  function handleWeightBlur(setNumber: number, text: string) {
    setWeights((edits) => carryWeightForward(edits, rows, setNumber));
    if (!isBodyWeightField || onBodyWeightChange === undefined) {
      return;
    }
    // On a pure bodyweight exercise this field holds the body weight itself, so what was typed
    // here is the block's new one — it reaches every bodyweight set still to be logged (task 105).
    const entered = parseWeight(text);
    if (entered !== null && entered > 0 && entered !== bodyWeight) {
      onBodyWeightChange(entered);
    }
  }

  // One note per card, for the set that is next to do and only while its numbers aren't a target
  // to hit — its weight has taken the target out of reach (08.7.1), or they are an estimate from
  // another day or block (134.1). The Weight fields live here, so this is where it can be read.
  const next = firstUnloggedRow(rows);
  const note = estimateNote(
    next,
    next === undefined ? '' : weightFieldText(weights, next, loadEquipment, bodyWeight),
    targetRir,
  );

  return (
    <>
      {rows.map((row) => (
        <WorkoutSetRow
          key={row.setNumber}
          row={row}
          equipment={loadEquipment}
          bodyWeight={bodyWeight}
          guided={guided}
          {...(raisedWeightReps !== undefined ? { raisedWeightReps } : {})}
          {...(asksForBodyWeight && onRequestBodyWeight !== undefined
            ? { onRequestBodyWeight }
            : {})}
          weightText={weightFieldText(weights, row, loadEquipment, bodyWeight)}
          onChangeWeight={(text) =>
            setWeights((edits) => editWeightText(edits, row.setNumber, text))
          }
          onBlurWeight={() =>
            handleWeightBlur(
              row.setNumber,
              weightFieldText(weights, row, loadEquipment, bodyWeight),
            )
          }
          editable={editable}
          isSaving={isSaving}
          onLog={(entry) => onLogSet(row.setNumber, entry)}
          onUnlog={() => {
            const logged = row.log;
            if (logged !== undefined) {
              setWeights((edits) => holdLoggedWeight(edits, row.setNumber, logged.weight));
            }
            onUnlogSet(row.setNumber);
          }}
        />
      ))}
      {editable && note !== undefined && <InlineNote lead={note.lead} text={note.text} />}
    </>
  );
}
