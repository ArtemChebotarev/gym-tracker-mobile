// Dialog — a card centred over a scrim (08.11 · Onboarding: the Welcome dialog and the first-deload
// popup share this body).
//
// Not a BottomSheet and not a Popover: a sheet rises from the bottom for content the user acts
// on, a Popover points at something on the screen. A Dialog says one thing and waits for one tap.
// A tap on the scrim does nothing — a stray touch must not count as having read the message — and
// the way out is whatever the caller offers: its own button, and `onClose`, which draws a cross
// in the corner and answers the Android back button. Without `onClose` the back button is
// swallowed too, so a dialog with only a button really has only that. The caller's handler is
// what records that the message was read, so the cross and the button should do the same thing.
// Presented through <Modal>, like BottomSheet, so the scrim covers the whole window including
// the tab bar.

import type { ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { CloseIcon } from '../icons/CloseIcon';
import { COLORS, ICON_SIZES, RADII, SHADOWS, SIZES, SPACING } from '../tokens';
import { IconButton } from './IconButton';

export type DialogProps = {
  visible: boolean;
  /** Draws a cross in the top-right corner and handles the Android back button. */
  onClose?: () => void;
  children: ReactNode;
};

export function Dialog({ visible, onClose, children }: DialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose ?? swallowBack}
    >
      <View style={styles.scrim}>
        <View testID="dialog" accessibilityViewIsModal style={styles.card}>
          {onClose !== undefined && (
            <View style={styles.close}>
              <IconButton accessibilityLabel="Close" onPress={onClose}>
                <CloseIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
              </IconButton>
            </View>
          )}
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
  close: {
    position: 'absolute',
    top: SPACING['space/screen'],
    right: SPACING['space/screen'],
    zIndex: 1,
  },
});
