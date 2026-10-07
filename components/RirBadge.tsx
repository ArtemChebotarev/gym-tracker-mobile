// The `N RIR` badge on an exercise card as a button (08.11 · Onboarding, GT-40): a tap opens a
// popover saying what RIR is, with the card's own number in it. On every week, a deload included.
//
// The chip is the same static chip the card always had; the button is only the touch area around
// it, 44pt tall through `hitSlop` — the chip is drawn smaller — and the anchor the popover points at.

import type { Ref } from 'react';
import { Pressable, View } from 'react-native';

import { Chip } from '@design/components/Chip';
import { Popover } from '@design/components/Popover';
import { tapTargetSlop } from '@design/shapes';
import { SIZES } from '@design/tokens';

import { RirExplanationContent } from './RirExplanationContent';
import { type RirExplanation } from './RirExplanationLogic';
import { styles } from './RirBadgeStyles';
import { usePopoverAnchor } from './usePopoverAnchor';

export type RirBadgeProps = {
  /** `2 RIR` */
  label: string;
  explanation: RirExplanation;
  /** The chip itself, without the touch area around it — what a coachmark's ring hugs (08.11). */
  chipRef?: Ref<View>;
};

export function RirBadge({ label, explanation, chipRef }: RirBadgeProps) {
  const { ref, visible, anchor, open, close } = usePopoverAnchor();

  return (
    <>
      <Pressable
        ref={ref}
        testID="exercise-rir"
        accessibilityRole="button"
        accessibilityLabel={`${label}, what is RIR?`}
        accessibilityState={{ expanded: visible }}
        onPress={open}
        hitSlop={tapTargetSlop(SIZES['size/icon-button'])}
        style={styles.button}
      >
        <View ref={chipRef}>
          <Chip variant="static" label={label} compact />
        </View>
      </Pressable>
      <Popover
        visible={visible}
        onClose={close}
        anchor={anchor}
        title={explanation.title}
      >
        <RirExplanationContent explanation={explanation} />
      </Popover>
    </>
  );
}
