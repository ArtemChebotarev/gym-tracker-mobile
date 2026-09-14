// Step 1 of 3 in the mesocycle editor, Flow A — from scratch (see 04 · Meso Creation Flows,
// "Flow A") — see 08.5 · Редактор мезоцикла — Flow A, "Шаг 1 — Basics", and its mockup
// 01-new-meso-basics.html (treated as the literal pixel spec, per task 075). Fully controlled,
// the same way ExerciseFormSheet.tsx is: the caller (app/meso-editor/basics.tsx) owns the draft
// values — kept in the zustand draft store so they survive navigation to steps 2 and 3 — plus
// what Close and Continue do.
//
// Both steppers reuse the Stepper component from 073 (task 075: "Оба степпера — компонент из
// 073") — its `formatValue`/`caption` props render the mockup's "6 weeks" / "Includes a deload
// week" value+caption directly inside the stepper-row card.
//
// JSX/rendering only — styles live in MesoEditorBasicsScreenStyles.ts and the pure Continue-gate
// check in MesoEditorBasicsScreenLogic.ts, per the code-style skill.

import { Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  MAX_DAYS_PER_WEEK,
  MAX_LENGTH_WEEKS,
  MIN_DAYS_PER_WEEK,
  MIN_LENGTH_WEEKS,
} from '@domain/mesocycleValidators';
import { Button } from '@design/components/Button';
import { IconButton } from '@design/components/IconButton';
import { Stepper } from '@design/components/Stepper';
import { TextField } from '@design/components/TextField';

import {
  canContinueFromBasics,
  formatDaysPerWeekValue,
  formatMesocycleLengthValue,
} from './MesoEditorBasicsScreenLogic';
import { styles } from './MesoEditorBasicsScreenStyles';

const TOTAL_STEPS = 3;
const CURRENT_STEP = 1;

export type MesoEditorBasicsScreenProps = {
  name: string;
  lengthWeeks: number;
  daysPerWeek: number;
  onChangeName: (name: string) => void;
  onChangeLengthWeeks: (lengthWeeks: number) => void;
  onChangeDaysPerWeek: (daysPerWeek: number) => void;
  onClose: () => void;
  onContinue: () => void;
};

export function MesoEditorBasicsScreen({
  name,
  lengthWeeks,
  daysPerWeek,
  onChangeName,
  onChangeLengthWeeks,
  onChangeDaysPerWeek,
  onClose,
  onContinue,
}: MesoEditorBasicsScreenProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton accessibilityLabel="Close" onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </IconButton>
          <Text style={styles.stepLabel}>{`Step ${CURRENT_STEP} of ${TOTAL_STEPS}`}</Text>
        </View>

        <Text style={styles.title}>New mesocycle</Text>

        <View style={styles.progress}>
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <View
              key={index}
              style={[styles.progressSegment, index < CURRENT_STEP && styles.progressSegmentDone]}
            />
          ))}
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <TextField
              label="Name"
              value={name}
              onChangeText={onChangeName}
              placeholder="e.g. Upper/Lower — Block 6"
            />
          </View>

          <View style={styles.section}>
            <Stepper
              label="Mesocycle length"
              value={lengthWeeks}
              onChange={onChangeLengthWeeks}
              min={MIN_LENGTH_WEEKS}
              max={MAX_LENGTH_WEEKS}
              formatValue={formatMesocycleLengthValue}
              caption="Includes a deload week"
            />
          </View>

          <View style={styles.section}>
            <Stepper
              label="Days per week"
              value={daysPerWeek}
              onChange={onChangeDaysPerWeek}
              min={MIN_DAYS_PER_WEEK}
              max={MAX_DAYS_PER_WEEK}
              formatValue={formatDaysPerWeekValue}
              caption="You'll pick exercises for each next"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label="Continue"
            onPress={onContinue}
            disabled={!canContinueFromBasics(name, lengthWeeks, daysPerWeek)}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
