// Set row — 08.7 · Тренировка, "Строка подхода" (task 093); 05, "Записать подход", "Снять отметку".
// One row per `SetTarget`: the set number, Weight and Reps, the target indicator, and the Log box.
//
// Editable (live mode, exercise not skipped):
// - unlogged — Weight holds the **value** the card gives it (`suggestedWeight`, what was typed, or
//   a weight carried over from an earlier set — task 106; else empty, `–` placeholder, decimal
//   keyboard); Reps starts empty with a placeholder (`repsPlaceholder`, number keyboard).
//   Log carries the accent outline on the exercise's first unlogged row. It logs what the fields
//   hold, an empty Reps taking the number the placeholder shows (`resolveSetEntry`) — so a row left
//   as recommended logs with one tap. With only `N RIR` to fall back on, Log waits for typed reps.
// - logged — plain numbers, the `✓ / +N / −N` indicator (only for a set with `targetReps`), and a
//   filled Log box. Tapping it un-logs the set, and the fields come back holding the logged values.
// Anything else (read-only, preview has no rows, a skipped exercise's logged rows) shows the same
// values with nothing to type or press. An unlogged row of a skipped exercise reads `Skipped` across
// Weight and Reps, with no Log box (05, "Пропустить упражнение").
//
// Laid out after the 08.7 mockup's set table: Weight · Reps · indicator · Log, all centered (no set
// number — Artem's review); the focused field's outline brightens.
//
// Typed-but-unlogged values are never saved (05, "Сохранение данных"). Reps live in this
// component's state; Weight lives one level up, in the exercise card, because it carries into the
// exercise's later sets (task 106). The screen does the writing through `onLog` / `onUnlog`.
// JSX/rendering only — styles live in WorkoutSetRowStyles.ts and pure helpers in
// WorkoutSetRowLogic.ts, per the code-style skill.

import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { usesAddedWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import { CheckIcon } from '@design/icons/CheckIcon';
import { tapTargetSlop } from '@design/shapes';
import { COLORS, ICON_SIZES, SIZES } from '@design/tokens';
import type { WorkoutSetRow as WorkoutSetRowModel } from '@usecases/workoutSession';

import {
  formatIndicator,
  formatLoggedWeight,
  isRirPlaceholder,
  isStrongIndicator,
  repsPlaceholder,
  resolveSetEntry,
} from './WorkoutSetRowLogic';
import { PLACEHOLDER_COLOR, styles } from './WorkoutSetRowStyles';

export type WorkoutSetRowProps = {
  row: WorkoutSetRowModel;
  /** The exercise's target RIR — the Reps placeholder when the set has no other. */
  targetRir: number | undefined;
  /** Decides what the Weight column means here — see `domain/bodyWeightLoad.ts` (task 105). */
  equipment?: Equipment;
  /** The block's body weight, added onto a `bodyweight-weighted` set's total when it's logged. */
  bodyWeight?: number;
  /**
   * Given while the block has no body weight yet and this is a bodyweight exercise: the Weight
   * cell becomes a button that asks for it instead of a field to type in (task 105). Nothing else
   * can be entered here until it's answered — the load is the body weight.
   */
  onRequestBodyWeight?: () => void;
  /** What the Weight field holds — the card owns it, so it can carry into the later sets (106). */
  weightText: string;
  onChangeWeight: (text: string) => void;
  /** The cursor left the Weight field — when the card carries its value forward. */
  onBlurWeight: () => void;
  /** Live mode and the exercise isn't skipped — the fields and the Log box work. */
  editable: boolean;
  /** A log or un-log is being saved — Log is held until it lands, so a double tap can't repeat it. */
  isSaving: boolean;
  onLog: (entry: { weight: number; reps: number; bodyWeight?: number }) => void;
  onUnlog: () => void;
};

export function WorkoutSetRow({
  row,
  targetRir,
  equipment,
  bodyWeight,
  onRequestBodyWeight,
  weightText,
  onChangeWeight,
  onBlurWeight,
  editable,
  isSaving,
  onLog,
  onUnlog,
}: WorkoutSetRowProps) {
  const [repsText, setRepsText] = useState('');
  const [focused, setFocused] = useState<'weight' | 'reps' | null>(null);
  const { log, setNumber } = row;
  const placeholder = repsPlaceholder(row, targetRir);
  const rirPlaceholder = isRirPlaceholder(row, targetRir);

  function handleUnlog(logged: { weight: number; reps: number }) {
    // The row goes back to editable fields holding what was logged (05, "Снять отметку") — the
    // card puts the weight back into its own state, this only has the reps.
    setRepsText(String(logged.reps));
    onUnlog();
  }

  if (row.isSkipped) {
    return (
      <View testID={`set-row-${setNumber}`} style={styles.row}>
        <View style={styles.skippedValues}>
          <Text style={styles.skippedLabel}>Skipped</Text>
        </View>
        <Text style={styles.indicator} />
        <View style={styles.logColumn} />
      </View>
    );
  }

  if (log) {
    return (
      <View testID={`set-row-${setNumber}`} style={styles.row}>
        <View style={[styles.field, styles.fieldLogged]}>
          <Text style={styles.value}>{formatLoggedWeight(log, equipment)}</Text>
        </View>
        <View style={[styles.field, styles.fieldLogged]}>
          <Text style={styles.value}>{log.reps}</Text>
        </View>
        <Text
          style={[
            styles.indicator,
            row.indicator !== undefined &&
              isStrongIndicator(row.indicator) &&
              styles.indicatorStrong,
          ]}
        >
          {row.indicator !== undefined ? formatIndicator(row.indicator) : ''}
        </Text>
        <View style={styles.logColumn}>
          {editable ? (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={`Set ${setNumber} logged`}
              accessibilityState={{ checked: true, disabled: isSaving }}
              disabled={isSaving}
              onPress={() => handleUnlog(log)}
              hitSlop={tapTargetSlop(SIZES['size/log-box'])}
              style={({ pressed }) => [
                styles.logBox,
                styles.logBoxLogged,
                pressed && styles.pressed,
              ]}
            >
              <CheckIcon size={ICON_SIZES['icon/small']} color={COLORS['accent/on']} />
            </Pressable>
          ) : (
            <View style={[styles.logBox, styles.logBoxLogged]}>
              <CheckIcon size={ICON_SIZES['icon/small']} color={COLORS['accent/on']} />
            </View>
          )}
        </View>
      </View>
    );
  }

  if (!editable) {
    return (
      <View testID={`set-row-${setNumber}`} style={styles.row}>
        <View style={styles.field}>
          {weightText === '' ? (
            <Text style={styles.placeholder}>–</Text>
          ) : (
            <Text style={styles.value}>{weightText}</Text>
          )}
        </View>
        <View style={styles.field}>
          <Text style={[styles.placeholder, rirPlaceholder && styles.placeholderRir]}>
            {placeholder}
          </Text>
        </View>
        <Text style={styles.indicator} />
        <View style={styles.logColumn}>
          <View style={styles.logBox} />
        </View>
      </View>
    );
  }

  const entry = resolveSetEntry(weightText, repsText, row);
  const canLog = entry !== null && !isSaving;

  return (
    <View testID={`set-row-${setNumber}`} style={styles.row}>
      {onRequestBodyWeight === undefined ? (
        <TextInput
          accessibilityLabel={`Set ${setNumber} weight`}
          value={weightText}
          onChangeText={onChangeWeight}
          onFocus={() => setFocused('weight')}
          onBlur={() => {
            setFocused(null);
            onBlurWeight();
          }}
          placeholder="–"
          placeholderTextColor={PLACEHOLDER_COLOR}
          keyboardType="decimal-pad"
          style={[
            styles.field,
            styles.fieldEditable,
            styles.input,
            focused === 'weight' && styles.fieldFocused,
          ]}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Set your body weight"
          onPress={onRequestBodyWeight}
          style={({ pressed }) => [
            styles.field,
            styles.fieldEditable,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.placeholder}>–</Text>
        </Pressable>
      )}
      <TextInput
        accessibilityLabel={`Set ${setNumber} reps`}
        value={repsText}
        onChangeText={setRepsText}
        onFocus={() => setFocused('reps')}
        onBlur={() => setFocused(null)}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER_COLOR}
        keyboardType="number-pad"
        style={[
          styles.field,
          styles.fieldEditable,
          styles.input,
          // A placeholder can't be sized on its own, so the empty field takes the smaller size.
          repsText === '' && rirPlaceholder && styles.placeholderRir,
          focused === 'reps' && styles.fieldFocused,
        ]}
      />
      <Text style={styles.indicator} />
      <View style={styles.logColumn}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={`Log set ${setNumber}`}
          accessibilityState={{ checked: false, disabled: !canLog }}
          disabled={!canLog}
          hitSlop={tapTargetSlop(SIZES['size/log-box'])}
          onPress={() => {
            if (entry) {
              // Show what's being logged — an empty Reps field fills in with its placeholder.
              setRepsText(String(entry.reps));
              // On a weighted bodyweight set the entered weight is only what was added; the body
              // weight goes with it so the set still reads the same later (task 105).
              onLog(
                usesAddedWeight(equipment) && bodyWeight !== undefined
                  ? { ...entry, bodyWeight }
                  : entry,
              );
            }
          }}
          style={({ pressed }) => [
            styles.logBox,
            row.isFirstUnlogged && styles.logBoxNext,
            pressed && styles.pressed,
          ]}
        />
      </View>
    </View>
  );
}
