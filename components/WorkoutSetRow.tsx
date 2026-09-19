// Set row — 08.7 · Тренировка, "Строка подхода" (task 093); 05, "Записать подход", "Снять отметку".
// One row per `SetTarget`: the set number, Weight and Reps, the target indicator, and the Log box.
//
// Editable (live mode, exercise not skipped):
// - unlogged — Weight starts with the **value** of `suggestedWeight` (else empty, `–` placeholder,
//   decimal keyboard); Reps starts empty with a placeholder (`repsPlaceholder`, number keyboard).
//   Log carries the accent outline on the exercise's first unlogged row. It logs what the fields
//   hold, an empty Reps taking the set's target reps (`resolveSetEntry`) — so a row left as
//   recommended logs with one tap. With no target to fall back on, Log waits for typed reps.
// - logged — plain numbers, the `✓ / +N / −N` indicator (only for a set with `targetReps`), and a
//   filled Log box. Tapping it un-logs the set, and the fields come back holding the logged values.
// Anything else (read-only, preview has no rows, a skipped exercise's logged rows) shows the same
// values with nothing to type or press. An unlogged row of a skipped exercise reads `Skipped` across
// Weight and Reps, with no Log box (05, "Пропустить упражнение").
//
// Laid out after the 08.7 mockup's set table: Weight · Reps · indicator · Log, all centered (no set
// number — Artem's review); the focused field's outline brightens.
//
// Typed-but-unlogged values live only in this component's state — they're never saved (05,
// "Сохранение данных"). The screen does the writing through `onLog` / `onUnlog`.
// JSX/rendering only — styles live in WorkoutSetRowStyles.ts and pure helpers in
// WorkoutSetRowLogic.ts, per the code-style skill.

import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { CheckIcon } from '@design/icons/CheckIcon';
import { COLORS } from '@design/tokens';
import type { WorkoutSetRow as WorkoutSetRowModel } from '@usecases/workoutSession';

import {
  formatIndicator,
  formatRowWeight,
  initialWeightText,
  isRirPlaceholder,
  isStrongIndicator,
  repsPlaceholder,
  resolveSetEntry,
} from './WorkoutSetRowLogic';
import { LOG_CHECK_ICON_SIZE, PLACEHOLDER_COLOR, styles } from './WorkoutSetRowStyles';

export type WorkoutSetRowProps = {
  row: WorkoutSetRowModel;
  /** The exercise's target RIR — the Reps placeholder when the set has no other. */
  targetRir: number | undefined;
  /** Live mode and the exercise isn't skipped — the fields and the Log box work. */
  editable: boolean;
  /** A log or un-log is being saved — Log is held until it lands, so a double tap can't repeat it. */
  isSaving: boolean;
  onLog: (entry: { weight: number; reps: number }) => void;
  onUnlog: () => void;
};

export function WorkoutSetRow({
  row,
  targetRir,
  editable,
  isSaving,
  onLog,
  onUnlog,
}: WorkoutSetRowProps) {
  const [weightText, setWeightText] = useState(() => initialWeightText(row));
  const [repsText, setRepsText] = useState('');
  const [focused, setFocused] = useState<'weight' | 'reps' | null>(null);
  const { log, setNumber } = row;
  const placeholder = repsPlaceholder(row, targetRir);
  const rirPlaceholder = isRirPlaceholder(row, targetRir);

  function handleUnlog(logged: { weight: number; reps: number }) {
    // The row goes back to editable fields holding what was logged (05, "Снять отметку").
    setWeightText(formatRowWeight(logged.weight));
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
          <Text style={styles.value}>{formatRowWeight(log.weight)}</Text>
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
              style={({ pressed }) => [
                styles.logBox,
                styles.logBoxLogged,
                pressed && styles.pressed,
              ]}
            >
              <CheckIcon size={LOG_CHECK_ICON_SIZE} color={COLORS['accent/on']} />
            </Pressable>
          ) : (
            <View style={[styles.logBox, styles.logBoxLogged]}>
              <CheckIcon size={LOG_CHECK_ICON_SIZE} color={COLORS['accent/on']} />
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
          {row.suggestedWeight !== undefined ? (
            <Text style={styles.value}>{formatRowWeight(row.suggestedWeight)}</Text>
          ) : (
            <Text style={styles.placeholder}>–</Text>
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
      <TextInput
        accessibilityLabel={`Set ${setNumber} weight`}
        value={weightText}
        onChangeText={setWeightText}
        onFocus={() => setFocused('weight')}
        onBlur={() => setFocused(null)}
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
          onPress={() => {
            if (entry) {
              // Show what's being logged — an empty Reps field fills in with the target.
              setRepsText(String(entry.reps));
              onLog(entry);
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
