// The "Finding your weight" plate — the Weight ⓘ's popover (08.11 · Onboarding, GT-39). A warm-up
// ladder before the first set, the one set that is logged, and a note that warm-up sets aren't. The
// warm-up and the working set are two blocks on purpose: the numbered steps say what comes in what
// order, the label and the accent number say which of them is logged. Static: it answers "which
// weight do I start with" the same way for every card, and does not read the data — only the RIR in
// the working set is the exercise's own.

import { Text, View } from 'react-native';

import { PlateRow } from '@design/components/PlateRow';
import { Popover } from '@design/components/Popover';
import type { AnchorRect } from '@design/popoverLayout';

import {
  FIRST_WEIGHT_TITLE,
  WARM_UP_LABEL,
  WARM_UP_NOTE,
  WARM_UP_STEPS,
  WORKING_SET_LABEL,
  workingSetText,
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
      <View style={styles.rows}>
        {WARM_UP_STEPS.map((text, index) => (
          <PlateRow key={index} compact leading={{ number: index + 1 }} text={text} />
        ))}
      </View>
      <Text style={styles.note}>{WARM_UP_NOTE}</Text>
      <View style={styles.separator} />
      <Text style={[styles.sectionLabel, styles.workingLabel]}>{WORKING_SET_LABEL}</Text>
      <View style={styles.rows}>
        <PlateRow compact accent leading={{ number: WARM_UP_STEPS.length + 1 }} text={workingSetText(targetRir)} />
      </View>
    </Popover>
  );
}
