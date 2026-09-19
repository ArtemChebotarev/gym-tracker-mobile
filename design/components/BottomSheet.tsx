// BottomSheet — see 08.0 · Design SDK, "Компоненты": grabber, title, optional action, content,
// footer. An optional subtitle sits under the title — `text/faint`, as in the 08.7 sheets
// (`Week 6 of 7 · 4 days a week` under the mesocycle name). Actions belong in the footer, with the confirming one primary on the right (08.0:
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
import { useEffect, useRef, useState } from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';

const DISMISS_DISTANCE = 60;
// No token exists yet for a modal scrim or the grabber's own pill size — both are
// implementation-only pixel details, same exception as IconButton's DIAMETER. SCRIM_COLOR is
// exported so a future overlay/modal component can reuse it instead of hardcoding its own.
export const SCRIM_COLOR = 'rgba(0, 0, 0, 0.5)';
const GRABBER_WIDTH = 36;
const GRABBER_HEIGHT = 4;
// The subtitle under the title — 12 / `text/faint`, 2pt below it, per the 08.7 mockup's sheets.
// No typography token sits at 12.
const SUBTITLE_FONT_SIZE = 12;
const SUBTITLE_GAP = 2;
// Caps the sheet so tall content (e.g. Dropdown's option list) scrolls inside it instead of
// overflowing past the screen — no token for this exists in 08.0 either. `height="fixed"` sheets
// use the same value as their exact height, so both kinds top out at the same line on screen.
const MAX_SHEET_HEIGHT = '80%';
// 'overlay' presentation's own slide, standing in for Modal's native `animationType="slide"`.
const OVERLAY_ANIMATION_DURATION = 250;

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** A short line under the title (08.7: the overview's `Week 6 of 7 · 4 days a week`). */
  subtitle?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Set to false to open/close instantly instead of sliding. Defaults to true (the normal
   * slide-up/down transition). Used with false when one BottomSheet hands off to another in
   * immediate succession (e.g. ExercisePickerSheet.tsx's Filters handoff, task 079) — two
   * sequential slide transitions there read as a stutter rather than a single deliberate motion. */
  animated?: boolean;
  /**
   * 'modal' (default) presents through React Native's own <Modal> — a real OS-level window.
   * 'overlay' instead renders as a plain absolutely-positioned view inside the normal component
   * tree, with no native window of its own, so a second, genuinely modal BottomSheet (e.g.
   * Filters) can open on top of it without two native modal windows ever coexisting — which is
   * what actually froze touch handling when MesoEditorAddExerciseSheet and ExerciseFiltersSheet
   * were both `<Modal>`s open at once (task 079). Only meaningful for a sheet another BottomSheet
   * can open from within — a standalone sheet has no reason to give up the real Modal.
   */
  presentation?: 'modal' | 'overlay';
  /**
   * 'content' (default) sizes the sheet to its content, capped at MAX_SHEET_HEIGHT. 'fixed' pins
   * it at MAX_SHEET_HEIGHT regardless of content, leaving empty space below short content — for a
   * sheet whose content shrinks as the user types into it (ExercisePickerSheet.tsx's live search,
   * task 082), where a content-sized sheet would jump in height on every keystroke. The content
   * ScrollView takes the remaining space, so a footer stays pinned to the sheet's bottom.
   */
  height?: 'content' | 'fixed';
};

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  action,
  footer,
  children,
  animated = true,
  presentation = 'modal',
  height = 'content',
}: BottomSheetProps) {
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

  const sheetBody = (
    <>
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
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle !== undefined && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {action}
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer !== undefined && <View style={styles.footer}>{footer}</View>}
    </>
  );

  const sheetStyle = [styles.sheet, height === 'fixed' && styles.sheetFixed];

  if (presentation === 'overlay') {
    return (
      <OverlaySheet visible={visible} onClose={onClose} animated={animated} sheetStyle={sheetStyle}>
        {sheetBody}
      </OverlaySheet>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animated ? 'slide' : 'none'}
      onRequestClose={onClose}
    >
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
        <SafeAreaView testID="bottom-sheet" edges={['bottom']} style={sheetStyle}>
          {sheetBody}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

type OverlaySheetProps = {
  visible: boolean;
  onClose: () => void;
  animated: boolean;
  sheetStyle: StyleProp<ViewStyle>;
  children: ReactNode;
};

// 'overlay' presentation's own stand-in for what <Modal> gives 'modal' presentation for free: not
// rendering at all while closed, and a slide transition covering both open and close (native
// `animationType="slide"` covers both directions too).
//
// `progress` is a stable Animated.Value read during render (the `translateY` it drives below) —
// `useState(() => new Animated.Value(...))` rather than `useRef(...).current`, since a plain ref
// read during render trips this codebase's react-hooks/refs rule; same reasoning as
// components/MesoEditorDaysStep.tsx's own `dragY`, see its comment on the same pattern.
function OverlaySheet({ visible, onClose, animated, sheetStyle, children }: OverlaySheetProps) {
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));

  useEffect(() => {
    if (visible) {
      // Syncing `mounted` to a `visible` prop change is exactly what this effect exists to do —
      // not a side effect layered on top of one. Setting it up-front (rather than only in the
      // timing's completion callback, which already covers the *unmount* half below) is what
      // gives the entrance animation something to animate from on its very first frame; deferring
      // it to a follow-up render would show one stale frame with the sheet still absent.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
    }
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: animated ? OVERLAY_ANIMATION_DURATION : 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
      }
    });
  }, [visible, animated, progress]);

  if (!mounted) {
    return null;
  }

  // Slides the whole presented block (backdrop + sheet) together, the same way Modal's own
  // `animationType="slide"` animates everything it presents as one unit rather than just the
  // sheet — see that branch above, where the backdrop Pressable sits inside the same Modal.
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_HEIGHT, 0] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
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
        <SafeAreaView testID="bottom-sheet" edges={['bottom']} style={sheetStyle}>
          {children}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Animated.View>
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
  sheetFixed: {
    height: MAX_SHEET_HEIGHT,
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
  titleBlock: {
    flexShrink: 1,
  },
  title: {
    fontSize: TYPOGRAPHY['type/sheet-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/sheet-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  subtitle: {
    marginTop: SUBTITLE_GAP,
    fontSize: SUBTITLE_FONT_SIZE,
    color: COLORS['text/faint'],
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
