// InfoGlyphButton — the ⓘ beside a column header that opens a Popover (08.7.1): a glyph in a 24pt
// disc, 44pt to the touch. While its plate is open the glyph sits on a lit disc (`open`) — the
// plate's anchor reads as the thing being explained. The caller passes the ref it measures for the
// Popover, and the accessibility label, which names what the plate says.

import type { Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { InfoIcon } from '../icons/InfoIcon';
import { circle, square } from '../shapes';
import { COLORS, ICON_SIZES, SIZES } from '../tokens';

export type InfoGlyphButtonProps = {
  accessibilityLabel: string;
  open: boolean;
  onPress: () => void;
  /** What the caller measures to point its Popover at the button. */
  buttonRef?: Ref<View>;
};

export function InfoGlyphButton({
  accessibilityLabel,
  open,
  onPress,
  buttonRef,
}: InfoGlyphButtonProps) {
  return (
    <Pressable
      ref={buttonRef}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={styles.button}
    >
      <View style={[styles.disc, open && styles.discOpen]}>
        <InfoIcon
          size={ICON_SIZES['icon/glyph']}
          color={open ? COLORS['text/primary'] : COLORS['text/muted']}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** The touch area — the iOS minimum, around a disc a third of its size. */
  button: {
    ...square(SIZES['size/tap-target']),
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
