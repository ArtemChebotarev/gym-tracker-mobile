// The "Finding your weight" plate — the Weight ⓘ's popover (08.11 · Onboarding, GT-39). A
// warm-up ladder, what to do after it, and a note that warm-up sets aren't logged. Static: it
// answers "which weight do I start with" the same way for every card, and does not read the data
// — only the RIR in its summary is the exercise's own.

import { Text, View } from 'react-native';

import { Chip } from '@design/components/Chip';
import { Popover } from '@design/components/Popover';
import type { AnchorRect } from '@design/popoverLayout';
import { SIZES } from '@design/tokens';

import {
  FIRST_WEIGHT_TAIL,
  FIRST_WEIGHT_TITLE,
  WARM_UP_LABEL,
  WARM_UP_NOTE,
  WARM_UP_STEPS,
  firstWeightLead,
} from './FirstWeightPopoverLogic';
import { styles } from './FirstWeightPopoverStyles';

export type FirstWeightPopoverProps = {
  visible: boolean;
  anchor: AnchorRect | null;
  onClose: () => void;
  /** The exercise's target RIR for this week, when it has one — what the working set is stopped at. */
  targetRir: number | undefined;
};

export function FirstWeightPopover({ visible, anchor, onClose, targetRir }: FirstWeightPopoverProps) {
  return (
    <Popover visible={visible} onClose={onClose} anchor={anchor} title={FIRST_WEIGHT_TITLE}>
      <Text style={styles.sectionLabel}>{WARM_UP_LABEL}</Text>
      <View style={styles.ladder}>
        {WARM_UP_STEPS.map((step) => (
          <View key={step.reps} style={styles.step}>
            <Chip variant="static" label={step.reps} compact accent width={SIZES['size/ladder-chip']} />
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.summary}>
        <Text style={styles.summaryLead}>{firstWeightLead(targetRir)}</Text> {FIRST_WEIGHT_TAIL}
      </Text>
      <Text style={styles.note}>{WARM_UP_NOTE}</Text>
    </Popover>
  );
}
