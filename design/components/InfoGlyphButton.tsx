// InfoGlyphButton — the ⓘ beside a column header that opens a Popover (08.7.1): a glyph in a 24pt
// disc, 44pt to the touch. While its plate is open the glyph sits on a lit disc (`open`) — the
// plate's anchor reads as the thing being explained. The caller passes the ref it measures for the
// Popover, and the accessibility label, which names what the plate says.

import type { Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { InfoIcon } from '../icons/InfoIcon';
import { circle, tapTargetSlop } from '../shapes';
import { COLORS, ICON_SIZES, SIZES } from '../tokens';

export type InfoGlyphButtonProps = {
  accessibilityLabel: string;
  open: boolean;
  onPress: () => void;
  /** What the caller measures to point its Popover at the button. */
  buttonRef?: Ref<View>;
  /**
   * The visible disc, without the touch area around it — what a coachmark's ring should hug (08.11):
   * measured through `buttonRef` the ring would wrap the whole 44pt target instead.
   */
  discRef?: Ref<View>;
};

export function InfoGlyphButton({
  accessibilityLabel,
  open,
  onPress,
  buttonRef,
  discRef,
}: InfoGlyphButtonProps) {
  return (
    <Pressable
      ref={buttonRef}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      hitSlop={{ left: SIDE_SLOP, right: SIDE_SLOP }}
      style={styles.button}
    >
      <View ref={discRef} style={[styles.disc, open && styles.discOpen]}>
        <InfoIcon
          size={ICON_SIZES['icon/glyph']}
          color={open ? COLORS['text/primary'] : COLORS['text/muted']}
        />
      </View>
    </Pressable>
  );
}

// What the disc lacks of the minimum touch width, on each side.
const SIDE_SLOP = tapTargetSlop(SIZES['size/glyph-button']);

const styles = StyleSheet.create({
  /**
   * As tall as the iOS minimum touch area, as wide as the disc: the glyph sits right after the label
   * it explains instead of a 44pt box's worth of air away (Artem's review, 18.10.2026). The rest of
   * the width is `hitSlop` either side.
   */
  button: {
    width: SIZES['size/glyph-button'],
    height: SIZES['size/tap-target'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    ...circle(SIZES['size/glyph-button']),
    alignItems: 'center',
    justifyContent: 'center',
  },
  discOpen: {
    backgroundColor: COLORS['surface/control-active'],
  },
});
