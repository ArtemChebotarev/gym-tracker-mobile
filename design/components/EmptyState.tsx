// EmptyState — see 08.0.1 · Empty states: icon in a circle + title + line + action, meant to read as
// an invitation rather than an apology (08.0: "Приглашение, а не извинение. Без «ничего нет»") — a
// copy rule for callers. The action is required, never optional, so an EmptyState always
// renders a way forward (08.0: "EmptyState всегда рендерит действие"). Reuses Button for the
// action rather than a second button implementation.
//
// The icon and the copy stand on the page, set large — the title at sheet-title size, the line at
// body size, across the full width — since with nothing framing them they carry the screen by
// themselves (a card around them was tried, and dropped). The actions sit apart, at the bottom of
// the room, full width — where the thumb is.
//
// A second, `secondary` button may sit with the main one when an empty screen has two honest ways
// forward — the Cycles tab's `Start from a template` and `Build from scratch` (08.10, GT-6). The
// main one is still the one primary on the screen, and it comes last, nearest the thumb.
//
// The layout belongs here, not to the screens: the component fills whatever room is left under a
// screen's header (a title, a back button or a search field — it doesn't care which) and centres
// the message in it — a little above the geometric centre, where the eye puts the middle — so every
// empty state sits the same way. The actions float over the bottom of that room rather than take a
// share of it, so the message stands in the same place whether one button is under it or two, and
// tab to tab it doesn't jump. A screen passes the icon, the copy and the action, and `bottomInset`
// when something covers the bottom of that room (the tab bar).
//
// The actions keep off the home indicator too, on a screen that doesn't (a detail screen whose
// SafeAreaView covers only the top) — see useBottomEdge.
//
// A search screen shows an empty state with the keyboard still up. Then the circle goes and the
// message and the actions stack just above the keyboard — the tab bar is behind it, so
// `bottomInset` no longer counts — so the screen's one way forward, `Create "…"`, isn't under the
// keyboard.

import { StyleSheet, Text, View } from 'react-native';
import type { IconComponent } from '../icons/IconFrame';
import { circle } from '../shapes';
import { BORDER_WIDTHS, COLORS, ICON_SIZES, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { useBottomEdge } from '../useBottomEdge';
import { Button } from './Button';

export type EmptyStateProps = {
  /** The icon drawn in the circle above the title. */
  icon: IconComponent;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  /** Room to leave at the bottom — the tab bar's clearance on a tab screen. */
  bottomInset?: number;
  /** A second way forward, drawn as a `secondary` button above the main one. */
  secondaryAction?: { label: string; onPress: () => void };
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  bottomInset = 0,
  secondaryAction,
}: EmptyStateProps) {
  const { ref, onLayout, keyboardOverlap, safeAreaShortfall } = useBottomEdge();
  const raised = keyboardOverlap > 0;
  // The tab bar's clearance already keeps off the home indicator; elsewhere the safe area may not.
  const bottom = Math.max(bottomInset, safeAreaShortfall);

  return (
    <View ref={ref} onLayout={onLayout} style={styles.fill}>
      <View
        testID="empty-state"
        style={[
          styles.container,
          raised
            ? [styles.containerRaised, { paddingBottom: keyboardOverlap + SPACING['space/screen'] }]
            : { paddingBottom: bottom + SPACING['space/empty-lift'] },
        ]}
      >
        <View testID="empty-state-message" style={styles.message}>
          {!raised && (
            <View testID="empty-state-icon" style={styles.iconCircle}>
              <Icon size={ICON_SIZES['icon/empty']} color={COLORS.accent} />
            </View>
          )}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View
          testID="empty-state-actions"
          style={
            raised
              ? styles.actionsRaised
              : [styles.actions, { bottom: bottom + SPACING['space/screen'] }]
          }
        >
          {secondaryAction !== undefined && (
            <Button
              label={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant="secondary"
            />
          )}
          <Button label={actionLabel} onPress={onAction} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING['space/screen'],
  },
  // Keyboard up: the message and the actions stack at the bottom of what is left, nothing floats.
  containerRaised: {
    justifyContent: 'flex-end',
    gap: SPACING['space/xl'],
  },
  message: {
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  iconCircle: {
    ...circle(SIZES['size/empty-icon']),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    marginBottom: SPACING['space/md'],
  },
  title: {
    fontSize: TYPOGRAPHY['type/sheet-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/sheet-title'].fontWeight,
    color: COLORS['text/primary'],
    textAlign: 'center',
  },
  description: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/secondary'],
    textAlign: 'center',
  },
  actions: {
    position: 'absolute',
    left: SPACING['space/screen'],
    right: SPACING['space/screen'],
    gap: SPACING['space/gap-tight'],
  },
  actionsRaised: {
    gap: SPACING['space/gap-tight'],
  },
});
