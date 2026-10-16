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

import type { ExerciseConfig } from '@domain/exerciseConfig';
import { fieldStyles } from '@design/components/fieldStyles';
import { SegmentedControl } from '@design/components/SegmentedControl';
import { StepperRow } from '@design/components/StepperRow';
import { TimePickerSheet } from '@design/components/TimePickerSheet';

import {
  describePowerLoad,
  formatClock,
  POWER_LOAD_OPTIONS,
  powerLoadFromValue,
} from './ExerciseFormLogic';
import { styles } from './ExerciseFormStyles';

// Every time field steps by the same 5 s, power's rest included.
const SECONDS_STEP = 5;
const MINUTE = 60;

/** A time field of a config: what it is called, what qualifies it, and what it may hold. */
type TimeField = {
  key: 'restSec' | 'workSec' | 'getReadySec' | 'durationSec';
  label: string;
  suffix?: string;
  minSec: number;
  maxSec: number;
};

const REST_BETWEEN_SETS: TimeField = {
  key: 'restSec',
  label: 'Rest',
  suffix: 'between sets',
  minSec: 0,
  maxSec: 10 * MINUTE,
};
const REST_BETWEEN_ROUNDS: TimeField = { ...REST_BETWEEN_SETS, suffix: 'between rounds' };
const WORK: TimeField = {
  key: 'workSec',
  label: 'Work',
  minSec: SECONDS_STEP,
  maxSec: 60 * MINUTE,
};
const COUNTDOWN: TimeField = {
  key: 'getReadySec',
  label: 'Countdown',
  suffix: 'before round',
  minSec: 0,
  maxSec: MINUTE / 2,
};
const DURATION: TimeField = {
  key: 'durationSec',
  label: 'Duration',
  minSec: MINUTE,
  maxSec: 60 * MINUTE,
};

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
        step={SECONDS_STEP}
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
      maxSec={editing?.maxSec ?? MINUTE}
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
