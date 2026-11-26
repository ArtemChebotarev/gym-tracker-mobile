// Snackbar — a short line about what just happened, with one action to take it back, over the
// bottom of the screen's content (GT-270: `Days reordered · Undo` after the Reorder days sheet).
// It goes away on its own after `durationMs` — `duration/snackbar`, 5 s, by default.
//
// It reports going away (`onHide`) and leaves showing it to the caller: render it while there is
// something to say, and give it a new `key` for a new message so its clock starts again. Pressing
// the action hides it too — the caller hears `onAction`, then `onHide`.
//
// It sits absolutely at the bottom of its parent, a screen margin in from the sides, on the
// popover's plate and shadow, so it reads as floating over the content rather than part of it.
// Nothing under it is blocked outside the plate itself.

import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tapTargetSlop } from '../shapes';
import { COLORS, DURATIONS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../tokens';

export type SnackbarProps = {
  message: string;
  actionLabel: string;
  onAction: () => void;
  /** Its time is up, or its action was pressed. */
  onHide: () => void;
  durationMs?: number;
};

export function Snackbar({
  message,
  actionLabel,
  onAction,
  onHide,
  durationMs = DURATIONS['duration/snackbar'],
}: SnackbarProps) {
  // The caller's latest `onHide`, so a re-render with a new closure doesn't restart the clock.
  const onHideRef = useRef(onHide);
  useEffect(() => {
    onHideRef.current = onHide;
  });

  useEffect(() => {
    const timer = setTimeout(() => onHideRef.current(), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  return (
    <View style={styles.plate} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        hitSlop={tapTargetSlop(SIZES['size/chip'])}
        onPress={() => {
          onAction();
          onHide();
        }}
      >
        <Text style={styles.action}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    position: 'absolute',
    left: SPACING['space/screen'],
    right: SPACING['space/screen'],
    bottom: SPACING['space/screen'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    paddingHorizontal: SPACING['space/screen'],
    paddingVertical: SPACING['space/md'],
    borderRadius: RADII['radius/control'],
    backgroundColor: COLORS['surface/popover'],
    ...SHADOWS['shadow/overlay'],
  },
  message: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/primary'],
  },
  action: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS.accent,
  },
});
