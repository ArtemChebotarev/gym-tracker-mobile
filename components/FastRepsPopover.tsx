// The Fast reps ⓘ plate of a power exercise (GT-81): what a power set is, laid out like the strength
// Reps plate — the first step, the corridor under it, the rest as steps. The words are
// `FastRepsPlateLogic.ts`.

import { View } from 'react-native';

import { PlateRow } from '@design/components/PlateRow';
import { Popover } from '@design/components/Popover';
import { RangeTrack } from '@design/components/RangeTrack';
import type { AnchorRect } from '@design/popoverLayout';

import { fastRepsPlate } from './FastRepsPlateLogic';
import { styles } from './SetsExerciseCardStyles';

export type FastRepsPopoverProps = {
  visible: boolean;
  anchor: AnchorRect | null;
  onClose: () => void;
};

export function FastRepsPopover({ visible, anchor, onClose }: FastRepsPopoverProps) {
  const plate = fastRepsPlate();
  const [first, ...rest] = plate.steps;
  return (
    <Popover visible={visible} onClose={onClose} anchor={anchor} title={plate.title}>
      <View style={styles.popoverSteps}>
        {first !== undefined && <PlateRow compact leading={{ number: 1 }} text={first} />}
      </View>
      <RangeTrack
        outer={plate.corridor.outer}
        inner={plate.corridor.inner}
        labels={plate.corridor.labels}
        accessibilityLabel={plate.corridor.accessibilityLabel}
      />
      <View style={[styles.popoverSteps, styles.popoverStepsAfterTrack]}>
        {rest.map((step, index) => (
          <PlateRow compact key={index} leading={{ number: index + 2 }} text={step} />
        ))}
      </View>
    </Popover>
  );
}
