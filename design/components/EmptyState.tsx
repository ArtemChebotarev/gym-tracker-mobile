// EmptyState — see 08.0.1 · Empty states: icon in a circle + title + line + action, meant to read as
// an invitation rather than an apology (08.0: "Приглашение, а не извинение. Без «ничего нет»") — a
// copy rule for callers. The action is required, never optional, so an EmptyState always
// renders a way forward (08.0: "EmptyState всегда рендерит действие"). Reuses Button for the
// action rather than a second button implementation.
//
// The layout belongs here, not to the screens: the component fills whatever room is left under a
// screen's header (a title, a back button or a search field — it doesn't care which) and starts
// its content a fixed distance below the top of it — high on the screen, not in the middle — so
// every empty state sits the same way. A screen passes the icon, the copy and the action.

import { StyleSheet, Text, View } from 'react-native';
import type { IconComponent } from '../icons/IconFrame';
import { circle } from '../shapes';
import {
  BORDER_WIDTHS,
  COLORS,
  ICON_SIZES,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '../tokens';
import { Button } from './Button';

export type EmptyStateProps = {
  /**
   * The icon drawn in the circle above the title. Optional only while the screens move over one
   * at a time (task 143); every empty state is meant to have one.
   */
  icon?: IconComponent;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View testID="empty-state" style={styles.container}>
      {Icon !== undefined && (
        <View testID="empty-state-icon" style={styles.iconCircle}>
          <Icon size={ICON_SIZES['icon/tab']} color={COLORS.accent} />
        </View>
      )}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.action}>
        <Button label={actionLabel} onPress={onAction} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACING['space/empty-top'],
    paddingHorizontal: SPACING['space/screen'],
    gap: SPACING['space/gap-tight'],
  },
  iconCircle: {
    ...circle(SIZES['size/empty-icon']),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    marginBottom: SPACING['space/gap-tight'],
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
  },
});
