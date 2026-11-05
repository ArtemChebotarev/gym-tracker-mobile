// EmptyState — see 08.0.1 · Empty states: icon in a circle + title + line + action, meant to read as
// an invitation rather than an apology (08.0: "Приглашение, а не извинение. Без «ничего нет»") — a
// copy rule for callers. The action is required, never optional, so an EmptyState always
// renders a way forward (08.0: "EmptyState всегда рендерит действие"). Reuses Button for the
// action rather than a second button implementation.
//
// A second, `secondary` button may sit under the main one when an empty screen has two honest ways
// forward — the Cycles tab's `Start from a template` and `Build from scratch` (08.10, GT-6). The
// main one is still the one primary on the screen; both take the width of the wider, so the pair
// reads as one block rather than two ragged buttons.
//
// The layout belongs here, not to the screens: the component fills whatever room is left under a
// screen's header (a title, a back button or a search field — it doesn't care which) and centres
// its content in it — a little above the geometric centre, where the eye puts the middle — so
// every empty state sits the same way. A screen passes the icon, the copy
// and the action, and `bottomInset` when something covers the bottom of that room (the tab bar).
//
// `framed` is the newer look, being rolled out screen by screen: the icon and the copy on a card,
// the buttons full width at the bottom of the room, the primary last.

import { StyleSheet, Text, View } from 'react-native';
import type { IconComponent } from '../icons/IconFrame';
import { circle } from '../shapes';
import { BORDER_WIDTHS, COLORS, ICON_SIZES, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { Button } from './Button';

export type EmptyStateProps = {
  /** The icon drawn in the circle above the title. */
  icon: IconComponent;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  /** Room to leave at the bottom of the centred area — the tab bar's clearance on a tab screen. */
  bottomInset?: number;
  /** A second way forward, drawn as a `secondary` button under the main one. */
  secondaryAction?: { label: string; onPress: () => void };
  /**
   * Draws the message on a card, like the blocks the rest of the app is built of, and moves the
   * actions to the bottom of the room. Workout and Cycles so far; the other empty states follow.
   */
  framed?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  bottomInset = 0,
  secondaryAction,
  framed = false,
}: EmptyStateProps) {
  const primary = <Button label={actionLabel} onPress={onAction} />;
  const secondary = secondaryAction !== undefined && (
    <Button label={secondaryAction.label} onPress={secondaryAction.onPress} variant="secondary" />
  );
  const message = (
    <>
      <View
        testID="empty-state-icon"
        style={[styles.iconCircle, framed && styles.iconCircleOnCard]}
      >
        <Icon size={ICON_SIZES['icon/empty']} color={COLORS.accent} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
    </>
  );

  // Framed: the message sits on a card in the middle of the room, and the actions leave it for the
  // bottom of the screen, full width, over the tab bar — where the thumb is, so the primary comes
  // last, nearest to it. The actions float over the room rather than take a share of it: the card
  // is centred in the whole room, so it stands in the same place whether one button is under it
  // or two, and tab to tab it doesn't jump.
  if (framed) {
    return (
      <View
        testID="empty-state"
        style={[
          styles.framedContainer,
          { paddingBottom: bottomInset + SPACING['space/empty-lift'] },
        ]}
      >
        <View testID="empty-state-card" style={styles.card}>
          {message}
        </View>
        <View
          testID="empty-state-actions"
          style={[styles.bottomAction, { bottom: bottomInset + SPACING['space/screen'] }]}
        >
          {secondary}
          {primary}
        </View>
      </View>
    );
  }

  return (
    <View
      testID="empty-state"
      style={[styles.container, { paddingBottom: bottomInset + SPACING['space/empty-lift'] }]}
    >
      <View style={styles.content}>
        {message}
        <View style={styles.action}>
          {primary}
          {secondary}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['space/screen'],
  },
  content: {
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  framedContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING['space/screen'],
  },
  bottomAction: {
    position: 'absolute',
    left: SPACING['space/screen'],
    right: SPACING['space/screen'],
    gap: SPACING['space/gap-tight'],
  },
  card: {
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
    backgroundColor: COLORS['surface/card'],
    borderRadius: RADII['radius/control'],
    paddingHorizontal: SPACING['space/row'],
    paddingVertical: SPACING['space/empty-card-y'],
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
  // On the card the circle would vanish into the same fill, so it sinks to the page colour.
  iconCircleOnCard: {
    backgroundColor: COLORS['surface/page'],
  },
  title: {
    maxWidth: SIZES['size/empty-text'],
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
    textAlign: 'center',
  },
  description: {
    maxWidth: SIZES['size/empty-text'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
    textAlign: 'center',
  },
  action: {
    marginTop: SPACING['space/gap'],
    alignItems: 'stretch',
    gap: SPACING['space/gap-tight'],
  },
});
