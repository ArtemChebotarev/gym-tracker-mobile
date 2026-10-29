// What an interval exercise progresses by, and by how much (10.1 FR-8, FR-9; canvas 4.3 "Progress
// by"). The second step of creating one, and a section of editing it. A lever is a card with what it
// does in words, not a bare name: "Less rest" alone does not say that it happens only when every
// round was finished.
//
// The step (5 / 10 / 15 s) is only asked for the levers that move time (FR-8: `rounds` is always
// one, `none` does not move).
//
// The heading is the caller's: the wizard's own title on the create page, a section label in the
// edit sheet.
//
// Controlled: edits one `IntervalConfig`.

import { Text, View } from 'react-native';

import {
  INTERVAL_LEVERS,
  INTERVAL_STEPS_SEC,
  type IntervalConfig,
  type IntervalLever,
} from '@domain/exerciseConfig';
import { OptionCard } from '@design/components/OptionCard';
import { SegmentedControl } from '@design/components/SegmentedControl';
import { fieldStyles } from '@design/components/fieldStyles';

import { styles } from './ExerciseFormStyles';
import {
  describeLever,
  describeStep,
  LEVER_LABEL,
  leverMovesTime,
} from './ExerciseProgressionFieldsLogic';

const STEP_OPTIONS = INTERVAL_STEPS_SEC.map((sec) => ({ value: String(sec), label: `${sec} s` }));

export type ExerciseProgressionFieldsProps = {
  config: IntervalConfig;
  onChange: (config: IntervalConfig) => void;
};

export function ExerciseProgressionFields({ config, onChange }: ExerciseProgressionFieldsProps) {
  return (
    <View>
      <Text style={styles.hint}>Miss a round and the plan repeats.</Text>
      <View style={styles.typeOptions} accessibilityRole="radiogroup">
        {INTERVAL_LEVERS.map((lever: IntervalLever) => (
          <OptionCard
            key={lever}
            title={LEVER_LABEL[lever]}
            description={describeLever(lever, config.stepSec)}
            selected={config.lever === lever}
            onPress={() => onChange({ ...config, lever })}
          />
        ))}
      </View>

      {leverMovesTime(config.lever) && (
        <View style={styles.progressionStep}>
          <Text style={fieldStyles.label}>Step</Text>
          <SegmentedControl
            options={STEP_OPTIONS}
            value={String(config.stepSec)}
            onChange={(stepSec) =>
              onChange({ ...config, stepSec: Number(stepSec) as IntervalConfig['stepSec'] })
            }
          />
          <Text style={styles.stepHint}>{describeStep(config.lever)}</Text>
        </View>
      )}
    </View>
  );
}
