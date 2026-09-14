// Step 1 of 3's own content in the mesocycle editor, Flow A — from scratch (see 04 · Meso
// Creation Flows, "Flow A") — see 08.5 · Редактор мезоцикла — Flow A, "Шаг 1 — Basics", and its
// mockup 01-new-meso-basics.html (treated as the literal pixel spec, per task 075). Fully
// controlled, the same way ExerciseFormSheet.tsx is: the caller (app/meso-editor/new.tsx) owns
// the draft values, kept in the zustand draft store so they survive moving to step 2 and back.
//
// This is just the step's fields — the header/progress-bar/footer chrome shared by every step
// lives one level up, in design/components/WizardScreen.tsx (task 076 review: giving every step
// its own screen, each with its own header/footer, meant switching steps unmounted one screen
// and mounted another, which visibly reset that chrome's position on every step change — the
// caller wants it to read as one persistent widget whose content swaps, not a stack of pages).
//
// Both steppers reuse the Stepper component from 073 (task 075: "Оба степпера — компонент из
// 073") — its `formatValue`/`caption` props render the mockup's "6 weeks" / "Includes a deload
// week" value+caption directly inside the stepper-row card.
//
// JSX/rendering only — styles live in MesoEditorBasicsStepStyles.ts and the pure Continue-gate
// check in MesoEditorBasicsStepLogic.ts, per the code-style skill.

import { View } from 'react-native';

import {
  MAX_DAYS_PER_WEEK,
  MAX_LENGTH_WEEKS,
  MIN_DAYS_PER_WEEK,
  MIN_LENGTH_WEEKS,
} from '@domain/mesocycleValidators';
import { Stepper } from '@design/components/Stepper';
import { TextField } from '@design/components/TextField';

import { formatDaysPerWeekValue, formatMesocycleLengthValue } from './MesoEditorBasicsStepLogic';
import { styles } from './MesoEditorBasicsStepStyles';

export type MesoEditorBasicsStepProps = {
  name: string;
  lengthWeeks: number;
  daysPerWeek: number;
  onChangeName: (name: string) => void;
  onChangeLengthWeeks: (lengthWeeks: number) => void;
  onChangeDaysPerWeek: (daysPerWeek: number) => void;
};

export function MesoEditorBasicsStep({
  name,
  lengthWeeks,
  daysPerWeek,
  onChangeName,
  onChangeLengthWeeks,
  onChangeDaysPerWeek,
}: MesoEditorBasicsStepProps) {
  return (
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
  );
}
