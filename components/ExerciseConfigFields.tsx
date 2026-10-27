// The type-specific fields of the New/Edit exercise page — see 10.1 FR-1 (which fields each type
// has). Controlled: it edits one `ExerciseConfig` and hands back the whole new one.
//
// Only a power exercise has any: its load (kg / level / none, FR-2). No type has a time here (FR-9,
// GT-188, GT-191): the rest between sets and Get ready are settings, an interval's work and rest
// and a mobility exercise's length come from history and are picked on the card the first time.
// An interval's progression (ExerciseProgressionFields) is a step of its own.
//
// JSX/rendering only — formatting lives in ExerciseFormLogic.ts.

import { Text, View } from 'react-native';

import type { ExerciseConfig } from '@domain/exerciseConfig';
import { fieldStyles } from '@design/components/fieldStyles';
import { SegmentedControl } from '@design/components/SegmentedControl';

import { describePowerLoad, POWER_LOAD_OPTIONS, powerLoadFromValue } from './ExerciseFormLogic';
import { styles } from './ExerciseFormStyles';

export type ExerciseConfigFieldsProps = {
  config: ExerciseConfig;
  onChange: (config: ExerciseConfig) => void;
};

export function ExerciseConfigFields({ config, onChange }: ExerciseConfigFieldsProps) {
  if (config.type !== 'power') {
    return null;
  }
  return (
    <View>
      <Text style={fieldStyles.label}>Load</Text>
      <SegmentedControl
        options={POWER_LOAD_OPTIONS}
        value={config.load}
        onChange={(load) => onChange({ ...config, load: powerLoadFromValue(load) })}
      />
      <Text style={[styles.stepHint, styles.loadHint]}>{describePowerLoad(config.load)}</Text>
    </View>
  );
}
