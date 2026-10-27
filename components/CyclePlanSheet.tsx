// The plan sheet of an interval exercise in the cycle editor — 10.1 FR-9, canvas 7.3 (GT-92). The row's plan chip opens it; what it edits is the cycle's own copy of the
// exercise's settings (`Mesocycle.exerciseSettings`, GT-158), never the library.
//
// Rounds, Progress by and — for a lever that moves time — Step. No times: work and rest come from
// history (GT-191), Get ready is a setting, the same for every interval (GT-188).
//
// A power exercise has no sheet: its rest is the one from Settings and its sets are the day's own,
// set on the row's stepper (GT-188). A mobility one has nothing to set at all (GT-191).
//
// Every change applies at once — the sheet is controlled, and Done only closes it. `Reset to
// defaults`, a link over the full-width Done, puts the library's values back.
//
// The fields take at least `size/plan-sheet-fields` (Artem, 18.10.2026), so the sheet keeps one
// height whether Step is shown or not. Canvas 7.3's note under the fields ("Week 1 of this
// cycle…") was dropped on the same review — it did not say anything the sheet's subtitle doesn't.
//
// Presented as an overlay rather than its own Modal (see BottomSheet's `presentation`).
//
// JSX/rendering only — styles live in CyclePlanSheetStyles.ts and pure helpers in
// CyclePlanSheetLogic.ts, per the code-style skill.

import { Pressable, Text, View } from 'react-native';

import { MAX_EXERCISE_SETS, MIN_EXERCISE_SETS } from '@domain/planValidators';
import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { fieldStyles } from '@design/components/fieldStyles';
import { SegmentedControl } from '@design/components/SegmentedControl';
import { StepperRow } from '@design/components/StepperRow';

import { leverMovesTime } from './ExerciseProgressionFieldsLogic';
import {
  leverFromValue,
  PLAN_LEVER_OPTIONS,
  PLAN_STEP_OPTIONS,
  planSheetSubtitle,
  stepFromValue,
} from './CyclePlanSheetLogic';
import { styles } from './CyclePlanSheetStyles';
import type { PlanSettings } from './MesoEditorDaysStepLogic';

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
  if (settings === undefined) {
    return null;
  }
  const current = settings;

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
      <View style={styles.fields}>
        <StepperRow
          label="Rounds"
          value={current.rounds}
          onChange={(rounds) => onChangeSettings({ ...current, rounds })}
          min={MIN_EXERCISE_SETS}
          max={MAX_EXERCISE_SETS}
        />
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
              onChange={(step) => onChangeSettings({ ...current, stepSec: stepFromValue(step) })}
            />
          </View>
        )}
      </View>
    </BottomSheet>
  );
}
