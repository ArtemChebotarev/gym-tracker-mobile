// The "Finding your weight" plate — the Weight ⓘ's popover (08.11 · Onboarding, GT-39). A warm-up
// ladder before the first set, the one set that is logged, and a note that warm-up sets aren't. The
// warm-up and the working set are two boxes on purpose: the numbered steps say what comes in what
// order, standing in one vertical across both, and the accent box says which of them is logged.
// Static: it answers "which weight do I start with" the same way for every card, and does not read
// the data — only the RIR in the working set is the exercise's own.

import { Text, View } from 'react-native';

import { PlateBox } from '@design/components/PlateBox';
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
      {copy.intro !== undefined && <Text style={styles.intro}>{copy.intro}</Text>}
      <PlateBox label={copy.warmUpLabel}>
        <View style={styles.rows}>
          {copy.warmUpSteps.map((text, index) => (
            <PlateRow key={index} compact boxed leading={{ number: index + 1 }} text={text} />
          ))}
        </View>
        <Text style={styles.note}>{copy.warmUpNote}</Text>
      </PlateBox>
      <PlateBox label={copy.workingLabel} accent>
        <PlateRow
          compact
          accent
          leading={{ number: copy.warmUpSteps.length + 1 }}
          text={copy.workingText}
        />
      </PlateBox>
    </Popover>
  );
}
