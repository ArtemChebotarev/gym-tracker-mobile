// The type-specific fields of the New/Edit exercise page — see 10.1 FR-1 (which fields each type
// has) and FR-9 (their system defaults, which the caller seeds). Controlled: it edits one
// `ExerciseConfig` and hands back the whole new one.
//
// Every number is a StepperRow whose value is also a button: `−` / `+` for a nudge, a tap on the
// value for the time picker (canvas 8.2), one instance told which field it is setting.
//
// An interval exercise asks for no number of rounds here: how many rounds or sets to do is set in
// the cycle and in the workout, as sets are for a strength exercise. `IntervalConfig.rounds` stays
// as the count a cycle starts from.
//
// A power exercise also picks its load (kg / level / none, FR-2). Not here: the interval's
// progression (ExerciseProgressionFields), which is a step of its own.
//
// JSX/rendering only — formatting lives in ExerciseFormLogic.ts.

import { useState } from 'react';
import { Text, View } from 'react-native';

import { CONFIG_TIME_STEP_SEC, type ExerciseConfig } from '@domain/exerciseConfig';
import { fieldStyles } from '@design/components/fieldStyles';
import { formatClock } from '@design/formatClock';
import { SegmentedControl } from '@design/components/SegmentedControl';
import { StepperRow } from '@design/components/StepperRow';
import { TimePickerSheet } from '@design/components/TimePickerSheet';

import {
  COUNTDOWN,
  DURATION,
  REST_BETWEEN_ROUNDS,
  REST_BETWEEN_SETS,
  WORK,
  type TimeField,
} from './ExerciseConfigFieldsLogic';
import {
  describePowerLoad,
  POWER_LOAD_OPTIONS,
  powerLoadFromValue,
} from './ExerciseFormLogic';
import { styles } from './ExerciseFormStyles';

export type ExerciseConfigFieldsProps = {
  config: ExerciseConfig;
  onChange: (config: ExerciseConfig) => void;
};

export function ExerciseConfigFields({ config, onChange }: ExerciseConfigFieldsProps) {
  // The time field whose picker is open, if any.
  const [editing, setEditing] = useState<TimeField | null>(null);

  function valueOf(field: TimeField): number {
    return (config as unknown as Record<string, number>)[field.key] ?? 0;
  }

  function setValue(field: TimeField, valueSec: number) {
    onChange({ ...config, [field.key]: valueSec } as ExerciseConfig);
  }

  function renderTimeRow(field: TimeField) {
    return (
      <StepperRow
        key={field.key}
        label={field.label}
        labelSuffix={field.suffix}
        value={valueOf(field)}
        onChange={(valueSec) => setValue(field, valueSec)}
        min={field.minSec}
        max={field.maxSec}
        step={CONFIG_TIME_STEP_SEC}
        formatValue={formatClock}
        onValuePress={() => setEditing(field)}
      />
    );
  }

  const picker = (
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
      value={editing === null ? 0 : valueOf(editing)}
      onChange={(valueSec) => editing !== null && setValue(editing, valueSec)}
      minSec={editing?.minSec}
      maxSec={editing?.maxSec ?? COUNTDOWN.maxSec}
    />
  );

  switch (config.type) {
    case 'power':
      return (
        <View>
          <Text style={fieldStyles.label}>Load</Text>
          <SegmentedControl
            options={POWER_LOAD_OPTIONS}
            value={config.load}
            onChange={(load) => onChange({ ...config, load: powerLoadFromValue(load) })}
          />
          <Text style={[styles.stepHint, styles.loadHint]}>{describePowerLoad(config.load)}</Text>
          {renderTimeRow(REST_BETWEEN_SETS)}
          {picker}
        </View>
      );
    case 'mobility':
      return (
        <View>
          {renderTimeRow(DURATION)}
          {picker}
        </View>
      );
    case 'interval':
      return (
        <View>
          <Text style={[fieldStyles.label, styles.sectionLabel]}>Default plan</Text>
          {renderTimeRow(WORK)}
          {renderTimeRow(REST_BETWEEN_ROUNDS)}
          {renderTimeRow(COUNTDOWN)}
          {picker}
        </View>
      );
  }
}
