// BottomSheet — see 08.0 · Design SDK, "Компоненты": grabber, title, optional action, content,
// footer. Actions belong in the footer, with the confirming one primary on the right (08.0:
// "Действия внизу. Подтверждающее — primary справа") — that ordering is up to the caller
// composing the footer, not something this component enforces.
//
// The task's DoD requires the sheet to close both "by gesture" and "by button" (task 061:
// "лист закрывается жестом и кнопкой"). There is no dedicated close icon in the component
// table, so the backdrop doubles as the button affordance (an accessibilityRole="button"
// Pressable that fills the screen behind the sheet), while dragging the grabber down past a
// threshold is the gesture. The drag is tracked with React Native's own responder events
// (onResponderGrant/onResponderRelease) rather than react-native-gesture-handler — the project
// has no direct dependency on that library (see package.json) — and a plain
// distance-since-touch-start check is all a dismiss threshold needs.
//
// The sheet itself is a SafeAreaView (bottom edge only — the Modal already covers the full
// screen, and the grabber/header at the top have nothing near the top inset to protect against).
// Without it, the last row of content or the footer button sits right against the home indicator
// on any device that has one, and can read as visually cropped. The same paddingBottom below
// still applies underneath the inset, exactly as RootScreen layers `space/screen` under the top
// inset — see that file's own SafeAreaView usage.
//
// KeyboardAvoidingView wraps the overlay so a focused TextField (e.g. the New/Edit exercise
// sheet's Name field) doesn't end up hidden behind the keyboard — `behavior: 'padding'` pads the
// overlay's bottom by the keyboard's height, and since the overlay is `justifyContent: 'flex-end'`
// that padding pushes the whole sheet up rather than squashing it. Android's default window-resize
// behavior already handles this, so no `behavior` is set there.
// `keyboardShouldPersistTaps="handled"` on the content ScrollView lets a tap on another field or
// a Dropdown option register in the same gesture instead of only dismissing the keyboard first.

import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';

const DISMISS_DISTANCE = 60;
// No token exists yet for a modal scrim or the grabber's own pill size — both are
// implementation-only pixel details, same exception as IconButton's DIAMETER. SCRIM_COLOR is
// exported so a future overlay/modal component can reuse it instead of hardcoding its own.
export const SCRIM_COLOR = 'rgba(0, 0, 0, 0.5)';
const GRABBER_WIDTH = 36;
const GRABBER_HEIGHT = 4;
// Caps the sheet so tall content (e.g. Dropdown's option list) scrolls inside it instead of
// overflowing past the screen — no token for this exists in 08.0 either.
const MAX_SHEET_HEIGHT = '80%';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function BottomSheet({ visible, onClose, title, action, footer, children }: BottomSheetProps) {
  const dragStartY = useRef<number | null>(null);

  function handleGrabberGrant(event: GestureResponderEvent) {
    dragStartY.current = event.nativeEvent.pageY;
  }

  function handleGrabberRelease(event: GestureResponderEvent) {
    const startY = dragStartY.current;
    dragStartY.current = null;
    if (startY !== null && event.nativeEvent.pageY - startY > DISMISS_DISTANCE) {
      onClose();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.backdrop}
          onPress={onClose}
        />
        <SafeAreaView testID="bottom-sheet" edges={['bottom']} style={styles.sheet}>
          <View
            testID="bottom-sheet-grabber-area"
            style={styles.grabberArea}
            onStartShouldSetResponder={() => true}
            onResponderGrant={handleGrabberGrant}
            onResponderRelease={handleGrabberRelease}
          >
            <View style={styles.grabber} />
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {action}
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer !== undefined && <View style={styles.footer}>{footer}</View>}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SCRIM_COLOR,
  },
  sheet: {
    maxHeight: MAX_SHEET_HEIGHT,
    backgroundColor: COLORS['surface/sheet'],
    borderTopLeftRadius: RADII['radius/sheet'],
    borderTopRightRadius: RADII['radius/sheet'],
    paddingBottom: SPACING['space/sheet'],
  },
  grabberArea: {
    alignItems: 'center',
    paddingVertical: SPACING['space/gap-tight'],
  },
  grabber: {
    width: GRABBER_WIDTH,
    height: GRABBER_HEIGHT,
    borderRadius: GRABBER_HEIGHT / 2,
    backgroundColor: COLORS['border/default'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING['space/sheet'],
    paddingBottom: SPACING['space/gap'],
  },
  title: {
    fontSize: TYPOGRAPHY['type/sheet-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/sheet-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  content: {
    paddingHorizontal: SPACING['space/sheet'],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING['space/gap-tight'],
    paddingHorizontal: SPACING['space/sheet'],
    paddingTop: SPACING['space/gap'],
  },
});
