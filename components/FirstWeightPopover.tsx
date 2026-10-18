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

import type { FirstWeightCopy } from './FirstWeightPopoverLogic';
import { styles } from './FirstWeightPopoverStyles';

export type FirstWeightPopoverProps = {
  visible: boolean;
  anchor: AnchorRect | null;
  onClose: () => void;
  /** What the plate says — see `firstWeightCopy`: the exercise's own target RIR, or power's own words. */
  copy: FirstWeightCopy;
};

export function FirstWeightPopover({ visible, anchor, onClose, copy }: FirstWeightPopoverProps) {
  return (
    <Popover visible={visible} onClose={onClose} anchor={anchor} title={copy.title}>
      <Text style={styles.sectionLabel}>{copy.warmUpLabel}</Text>
      <View style={styles.rows}>
        {copy.warmUpSteps.map((text, index) => (
          <PlateRow key={index} compact leading={{ number: index + 1 }} text={text} />
        ))}
      </View>
      <Text style={styles.note}>{copy.warmUpNote}</Text>
      <View style={styles.separator} />
      <Text style={[styles.sectionLabel, styles.workingLabel]}>{copy.workingLabel}</Text>
      <View style={styles.rows}>
        <PlateRow
          compact
          accent
          leading={{ number: copy.warmUpSteps.length + 1 }}
          text={copy.workingText}
        />
      </View>
    </Popover>
  );
}
