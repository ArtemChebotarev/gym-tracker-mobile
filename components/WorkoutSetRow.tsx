// Set row — 08.7 · Тренировка, "Строка подхода" (task 093); 05, "Записать подход", "Снять отметку".
// One row per `SetTarget`: the set number, Weight and Reps, the target indicator, and the Log box.
//
// Editable (live mode, exercise not skipped):
// - unlogged — Weight starts with the **value** of `suggestedWeight` (else empty, `–` placeholder,
//   decimal keyboard); Reps starts empty with a placeholder (`repsPlaceholder`, number keyboard).
//   Log is inactive until both fields hold a value — a placeholder isn't one — and carries the
//   accent outline on the exercise's first unlogged row.
// - logged — plain numbers, the `✓ / +N / −N` indicator (only for a set with `targetReps`), and a
//   filled Log box. Tapping it un-logs the set, and the fields come back holding the logged values.
// Anything else (read-only, preview has no rows, a skipped exercise's logged rows) shows the same
// values with nothing to type or press.
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
  parseSetEntry,
  repsPlaceholder,
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
  const { log, setNumber } = row;

  function handleUnlog(logged: { weight: number; reps: number }) {
    // The row goes back to editable fields holding what was logged (05, "Снять отметку").
    setWeightText(formatRowWeight(logged.weight));
    setRepsText(String(logged.reps));
    onUnlog();
  }

  if (log) {
    return (
      <View testID={`set-row-${setNumber}`} style={styles.row}>
        <Text style={[styles.setNumberColumn, styles.setNumber]}>{setNumber}</Text>
        <View style={[styles.valueColumn, styles.loggedValue]}>
          <Text style={styles.value}>{formatRowWeight(log.weight)}</Text>
        </View>
        <View style={[styles.valueColumn, styles.loggedValue]}>
          <View style={styles.repsValue}>
            <Text style={styles.value}>{log.reps}</Text>
            {row.indicator !== undefined && (
              <Text style={styles.indicator}>{formatIndicator(row.indicator)}</Text>
            )}
          </View>
        </View>
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
        <Text style={[styles.setNumberColumn, styles.setNumber]}>{setNumber}</Text>
        <View style={[styles.valueColumn, styles.field]}>
          {row.suggestedWeight !== undefined ? (
            <Text style={styles.value}>{formatRowWeight(row.suggestedWeight)}</Text>
          ) : (
            <Text style={styles.placeholder}>–</Text>
          )}
        </View>
        <View style={[styles.valueColumn, styles.field]}>
          <Text style={styles.placeholder}>{repsPlaceholder(row, targetRir)}</Text>
        </View>
        <View style={styles.logColumn}>
          <View style={styles.logBox} />
        </View>
      </View>
    );
  }

  const entry = parseSetEntry(weightText, repsText);
  const canLog = entry !== null && !isSaving;

  return (
    <View testID={`set-row-${setNumber}`} style={styles.row}>
      <Text style={[styles.setNumberColumn, styles.setNumber]}>{setNumber}</Text>
      <TextInput
        accessibilityLabel={`Set ${setNumber} weight`}
        value={weightText}
        onChangeText={setWeightText}
        placeholder="–"
        placeholderTextColor={PLACEHOLDER_COLOR}
        keyboardType="decimal-pad"
        style={[styles.valueColumn, styles.field, styles.input]}
      />
      <TextInput
        accessibilityLabel={`Set ${setNumber} reps`}
        value={repsText}
        onChangeText={setRepsText}
        placeholder={repsPlaceholder(row, targetRir)}
        placeholderTextColor={PLACEHOLDER_COLOR}
        keyboardType="number-pad"
        style={[styles.valueColumn, styles.field, styles.input]}
      />
      <View style={styles.logColumn}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={`Log set ${setNumber}`}
          accessibilityState={{ checked: false, disabled: !canLog }}
          disabled={!canLog}
          onPress={() => {
            if (entry) {
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
