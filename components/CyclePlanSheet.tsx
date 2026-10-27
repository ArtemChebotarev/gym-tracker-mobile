// The plan sheet of an interval or mobility exercise in the cycle editor — 10.1 FR-9, canvas 7.3
// (GT-92). The row's plan chip opens it; what it edits is the cycle's own copy of the
// exercise's settings (`Mesocycle.exerciseSettings`, GT-158), never the library.
//
// - interval: Rounds, Work, Rest, Progress by and — for a lever that moves time — Step. Get ready
//   is a setting, the same for every interval (GT-188).
// - mobility: Length.
//
// A power exercise has no sheet: its rest is the one from Settings and its sets are the day's own,
// set on the row's stepper (GT-188).
//
// Every change applies at once — the sheet is controlled, and Done only closes it. `Reset to
// defaults`, a link over the full-width Done, puts the library's values back.
//
// One height for every type (Artem, 18.10.2026): the fields take at least `size/plan-sheet-fields`
// — what an interval plan with its Step row needs — so a mobility plan's one row opens the same
// sheet an interval's eight do, and Reset and Done sit right under the fields of the tallest one. Canvas 7.3's note under the fields ("Week 1 of this cycle…") was dropped on
// the same review — it did not say anything the sheet's subtitle doesn't.
//
// Presented as an overlay rather than its own Modal, so the time picker — a real Modal — can open
// on top of it (see BottomSheet's `presentation`).
//
// JSX/rendering only — styles live in CyclePlanSheetStyles.ts and pure helpers in
// CyclePlanSheetLogic.ts, per the code-style skill.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MAX_EXERCISE_SETS, MIN_EXERCISE_SETS } from '@domain/planValidators';
import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { fieldStyles } from '@design/components/fieldStyles';
import { SegmentedControl } from '@design/components/SegmentedControl';
import { StepperRow } from '@design/components/StepperRow';
import { TimePickerSheet } from '@design/components/TimePickerSheet';
import { formatClock } from '@design/formatClock';

import { DURATION, REST_BETWEEN_ROUNDS, WORK, type TimeField } from './ExerciseConfigFieldsLogic';
import { leverMovesTime } from './ExerciseProgressionFieldsLogic';
import {
  leverFromValue,
  PLAN_LEVER_OPTIONS,
  PLAN_STEP_OPTIONS,
  planSheetSubtitle,
  stepFromValue,
  timeFieldValue,
  withTimeField,
} from './CyclePlanSheetLogic';
import { styles } from './CyclePlanSheetStyles';
import type { PlanSettings } from './MesoEditorDaysStepLogic';

// The plan sheet's name for the config's duration (canvas 7.3).
const LENGTH: TimeField = { ...DURATION, label: 'Length' };

export type CyclePlanSheetProps = {
  visible: boolean;
  exerciseName: string;
  dayNumber: number;
  settings: PlanSettings | undefined;
  onChangeSettings: (settings: PlanSettings) => void;
  onReset: () => void;
  onClose: () => void;
};

export function CyclePlanSheet({
  visible,
  exerciseName,
  dayNumber,
  settings,
  onChangeSettings,
  onReset,
  onClose,
}: CyclePlanSheetProps) {
  // The time field whose picker is open, if any.
  const [editing, setEditing] = useState<TimeField | null>(null);

  if (settings === undefined) {
    return null;
  }
  const current = settings;

  function renderTimeRow(field: TimeField) {
    return (
      <StepperRow
        key={field.key}
        label={field.label}
        labelSuffix={field.suffix}
        value={timeFieldValue(current, field.key)}
        onChange={(valueSec) => onChangeSettings(withTimeField(current, field.key, valueSec))}
        min={field.minSec}
        max={field.maxSec}
        step={field.stepSec}
        formatValue={formatClock}
        onValuePress={() => setEditing(field)}
      />
    );
  }

  function renderFields() {
    switch (current.type) {
      case 'mobility':
        return renderTimeRow(LENGTH);
      case 'interval':
        return (
          <>
            <StepperRow
              label="Rounds"
              value={current.rounds}
              onChange={(rounds) => onChangeSettings({ ...current, rounds })}
              min={MIN_EXERCISE_SETS}
              max={MAX_EXERCISE_SETS}
            />
            {renderTimeRow(WORK)}
            {renderTimeRow(REST_BETWEEN_ROUNDS)}
            <View style={styles.section}>
              <Text style={fieldStyles.label}>Progress by</Text>
              <SegmentedControl
                options={PLAN_LEVER_OPTIONS}
                value={current.lever}
                onChange={(lever) => onChangeSettings({ ...current, lever: leverFromValue(lever) })}
              />
            </View>
            {leverMovesTime(current.lever) && (
              <View style={styles.stepRow}>
                <Text style={fieldStyles.label}>Step</Text>
                <SegmentedControl
                  options={PLAN_STEP_OPTIONS}
                  value={String(current.stepSec)}
                  onChange={(step) =>
                    onChangeSettings({ ...current, stepSec: stepFromValue(step) })
                  }
                />
              </View>
            )}
          </>
        );
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={exerciseName}
      subtitle={planSheetSubtitle(dayNumber)}
      presentation="overlay"
      footer={
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={onReset}
            style={({ pressed }) => [styles.reset, pressed && styles.pressed]}
          >
            <Text style={styles.resetLabel}>Reset to defaults</Text>
          </Pressable>
          <Button label="Done" onPress={onClose} />
        </View>
      }
    >
      <View style={styles.fields}>{renderFields()}</View>
      <TimePickerSheet
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing === null
            ? ''
            : editing.suffix === undefined
              ? editing.label
              : `${editing.label} · ${editing.suffix}`
        }
        value={editing === null ? 0 : timeFieldValue(current, editing.key)}
        onChange={(valueSec) =>
          editing !== null && onChangeSettings(withTimeField(current, editing.key, valueSec))
        }
        minSec={editing?.minSec}
        stepSec={editing?.stepSec}
        maxSec={editing?.maxSec ?? DURATION.maxSec}
      />
    </BottomSheet>
  );
}
