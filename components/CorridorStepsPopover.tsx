// A Reps ⓘ plate in the corridor-and-steps shape (08.7.1, "no history"): the first step, the rep
// corridor drawn under it, then the rest as steps. The strength plate with no history, power's Fast
// reps plate and a band's plate all draw through it; the words are their Logic's
// (`CorridorStepsPlate`).

import { View } from 'react-native';

import { PlateRow } from '@design/components/PlateRow';
import { Popover } from '@design/components/Popover';
import { RangeTrack } from '@design/components/RangeTrack';
import type { AnchorRect } from '@design/popoverLayout';

import type { CorridorStepsPlate } from './CorridorStepsPlateLogic';
import { styles } from './CorridorStepsPopoverStyles';

export type CorridorStepsPopoverProps = {
  plate: CorridorStepsPlate;
  visible: boolean;
  anchor: AnchorRect | null;
  onClose: () => void;
};

export function CorridorStepsPopover({ plate, visible, anchor, onClose }: CorridorStepsPopoverProps) {
  const [first, ...rest] = plate.steps;
  return (
    <Popover visible={visible} onClose={onClose} anchor={anchor} title={plate.title}>
      {/* The step to take comes first, the corridor it is measured in right under it, then the
          rest — the order Artem asked for (07.10.2026). Gaps are the recommended-weight plate's:
          `space/xl` between blocks, `space/dots` between rows. */}
      <View style={styles.steps}>
        {first !== undefined && <PlateRow compact leading={{ number: 1 }} text={first} />}
      </View>
      <RangeTrack
        outer={plate.corridor.outer}
        inner={plate.corridor.inner}
        labels={plate.corridor.labels}
        accessibilityLabel={plate.corridor.accessibilityLabel}
      />
      <View style={[styles.steps, styles.stepsAfterTrack]}>
        {rest.map((step, index) => (
          <PlateRow compact key={index} leading={{ number: index + 2 }} text={step} />
        ))}
      </View>
    </Popover>
  );
}
