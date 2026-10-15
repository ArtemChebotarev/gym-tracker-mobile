// The type-specific fields of the New/Edit exercise sheet — see 10.1 FR-1 (which fields each type
// has) and FR-9 (their system defaults, which the caller seeds). Controlled: it edits one
// `ExerciseConfig` and hands back the whole new one.
//
// Not here: the power load kind (kg / level / none, FR-2) — it has its own task (GT-75).
//
// JSX/rendering only — formatting lives in ExerciseFormSheetLogic.ts.

import { Text, View } from 'react-native';

import { INTERVAL_LEVERS, INTERVAL_STEPS_SEC, type ExerciseConfig, type IntervalLever } from '@domain/exerciseConfig';
import { Dropdown } from '@design/components/Dropdown';
import { SegmentedControl } from '@design/components/SegmentedControl';
import { fieldStyles } from '@design/components/fieldStyles';
import { StepperRow } from '@design/components/StepperRow';

import { formatClock } from './ExerciseFormSheetLogic';
import { styles } from './ExerciseFormSheetStyles';

// Every time field steps by the same 5 s, power's rest included.
const SECONDS_STEP = 5;
const MINUTE = 60;

// What each lever is called where the user picks it (canvas 4.x, CreateInterval; FR-8).
const LEVER_LABEL: Record<IntervalLever, string> = {
  rest: 'Less rest',
  workTime: 'More work',
  rounds: 'More rounds',
  none: 'Keep plan',
};

const LEVER_OPTIONS = INTERVAL_LEVERS.map((lever) => ({ value: lever, label: LEVER_LABEL[lever] }));
const STEP_OPTIONS = INTERVAL_STEPS_SEC.map((sec) => ({ value: String(sec), label: `${sec} s` }));

export type ExerciseConfigFieldsProps = {
  config: ExerciseConfig;
  onChange: (config: ExerciseConfig) => void;
};

export function ExerciseConfigFields({ config, onChange }: ExerciseConfigFieldsProps) {
  switch (config.type) {
    case 'power':
      return (
        <StepperRow
          label="Rest between sets"
          caption="Starts after you log a set"
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
      const stepApplies = config.lever === 'rest' || config.lever === 'workTime';
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
            caption="Same between every round"
            value={config.restSec}
            onChange={(restSec) => onChange({ ...config, restSec })}
            min={0}
            max={10 * MINUTE}
            step={SECONDS_STEP}
            formatValue={formatClock}
          />
          <StepperRow
            label="Get ready"
            caption="Countdown before a round you start with a tap"
            value={config.getReadySec}
            onChange={(getReadySec) => onChange({ ...config, getReadySec })}
            min={0}
            max={MINUTE / 2}
            step={SECONDS_STEP}
            formatValue={formatClock}
          />

          <View style={[styles.field, styles.progression]}>
            <Dropdown
              label="Progress by"
              options={LEVER_OPTIONS}
              value={config.lever}
              onChange={(lever) => onChange({ ...config, lever: lever as IntervalLever })}
              placeholder="Choose what progresses"
            />
          </View>
          {stepApplies && (
            <View style={styles.field}>
              <SegmentedControl
                options={STEP_OPTIONS}
                value={String(config.stepSec)}
                onChange={(stepSec) =>
                  onChange({ ...config, stepSec: Number(stepSec) as typeof config.stepSec })
                }
              />
            </View>
          )}
        </View>
      );
    }
  }
}
