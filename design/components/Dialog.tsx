// Dialog — a card centred over a scrim, closed only by what the caller puts in it (08.11 ·
// Onboarding: the Welcome dialog and the first-deload popup share this body).
//
// Not a BottomSheet and not a Popover: a sheet rises from the bottom for content the user acts
// on, a Popover points at something on the screen. A Dialog says one thing and waits for one tap.
// So there is no close affordance of its own — no cross, a tap on the scrim does nothing, and the
// Android back button is swallowed — because "the only way out is the button" (08.11) is the point:
// the caller's button is what records that the message was read. Presented through <Modal>, like
// BottomSheet, so the scrim covers the whole window including the tab bar.

import type { ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { COLORS, RADII, SHADOWS, SIZES, SPACING } from '../tokens';

export type DialogProps = {
  visible: boolean;
  children: ReactNode;
};

export function Dialog({ visible, children }: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={swallowBack}>
      <View style={styles.scrim}>
        <View testID="dialog" accessibilityViewIsModal style={styles.card}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

/** Android's back button must not close a dialog whose only exit is its own button. */
function swallowBack() {}

const styles = StyleSheet.create({
  // A row, so the card's `flexShrink` works along the width: a phone narrower than the card plus
  // the screen padding squeezes the card instead of pushing it off the edge.
  scrim: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['space/screen'],
    backgroundColor: COLORS['overlay/scrim'],
  },
  card: {
    width: SIZES['size/dialog'],
    flexShrink: 1,
    paddingHorizontal: SPACING['space/dialog'],
    paddingVertical: SPACING['space/dialog-y'],
    borderRadius: RADII['radius/sheet'],
    backgroundColor: COLORS['surface/sheet'],
    ...SHADOWS['shadow/overlay'],
  },
});
