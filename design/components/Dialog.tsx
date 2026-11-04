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
// the tab bar. The card is never taller than the window inside its safe area: a caller with more
// to say than fits puts that part in a ScrollView with `flexShrink: 1`, which then gives way while
// the rest — the title, the button — stays in view (the Finish popup, GT-220).

import { useContext, type ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

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
  // From the root SafeAreaProvider, as BottomSheet reads it: a SafeAreaView inside <Modal>
  // measures against the wrong window.
  const insets = useContext(SafeAreaInsetsContext);
  const top = insets?.top ?? 0;
  const bottom = insets?.bottom ?? 0;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose ?? swallowBack}
    >
      <View
        style={[
          styles.scrim,
          {
            paddingTop: top + SPACING['space/screen'],
            paddingBottom: bottom + SPACING['space/screen'],
          },
        ]}
      >
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
    maxHeight: SIZES['size/dialog-max'],
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
