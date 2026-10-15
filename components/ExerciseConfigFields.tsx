// The type-specific fields of the New/Edit exercise sheet — see 10.1 FR-1 (which fields each type
// has) and FR-9 (their system defaults, which the caller seeds). Controlled: it edits one
// `ExerciseConfig` and hands back the whole new one.
//
// Not here: the power load kind (kg / level / none, FR-2) — it has its own task (GT-75) — and the
// interval's progression (ExerciseProgressionFields), which is a step of its own.
//
// JSX/rendering only — formatting lives in ExerciseFormSheetLogic.ts.

import { Text, View } from 'react-native';

import type { ExerciseConfig } from '@domain/exerciseConfig';
import { fieldStyles } from '@design/components/fieldStyles';
import { StepperRow } from '@design/components/StepperRow';

import { formatClock } from './ExerciseFormSheetLogic';
import { styles } from './ExerciseFormSheetStyles';

// Every time field steps by the same 5 s, power's rest included.
const SECONDS_STEP = 5;
const MINUTE = 60;

export type ExerciseConfigFieldsProps = {
  config: ExerciseConfig;
  onChange: (config: ExerciseConfig) => void;
};

export function ExerciseConfigFields({ config, onChange }: ExerciseConfigFieldsProps) {
  switch (config.type) {
    case 'power':
      return (
        <StepperRow
          label="Rest"
          labelSuffix="between sets"
          value={config.restSec}
          onChange={(restSec) => onChange({ ...config, restSec })}
          min={0}
          max={10 * MINUTE}
          step={SECONDS_STEP}
          formatValue={formatClock}
        />
      );
    case 'mobility':
      return (
        <StepperRow
          label="Duration"
          value={config.durationSec}
          onChange={(durationSec) => onChange({ ...config, durationSec })}
          min={MINUTE}
          max={60 * MINUTE}
          step={MINUTE}
          formatValue={formatClock}
        />
      );
    case 'interval': {
      return (
        <View>
          <Text style={[fieldStyles.label, styles.sectionLabel]}>Default plan</Text>
          <StepperRow
            label="Rounds"
            value={config.rounds}
            onChange={(rounds) => onChange({ ...config, rounds })}
            min={1}
            max={30}
          />
          <StepperRow
            label="Work"
            value={config.workSec}
            onChange={(workSec) => onChange({ ...config, workSec })}
            min={SECONDS_STEP}
            max={60 * MINUTE}
            step={SECONDS_STEP}
            formatValue={formatClock}
          />
          <StepperRow
            label="Rest"
            labelSuffix="between rounds"
            value={config.restSec}
            onChange={(restSec) => onChange({ ...config, restSec })}
            min={0}
            max={10 * MINUTE}
            step={SECONDS_STEP}
            formatValue={formatClock}
          />
          <StepperRow
            label="Countdown"
            labelSuffix="before round"
            value={config.getReadySec}
            onChange={(getReadySec) => onChange({ ...config, getReadySec })}
            min={0}
            max={MINUTE / 2}
            step={SECONDS_STEP}
            formatValue={formatClock}
          />
        </View>
      );
    }
  }
}
