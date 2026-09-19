// ActionRow — one action in a menu sheet, after the 08.7 mockup's `⋯` sheets (header menu, 096;
// exercise menu, 097): an 18pt icon on the left, the label, and a divider above each row. The row
// picks the icon's color itself, so the caller passes the icon component rather than a rendered
// icon — `danger` tints both icon and label red (08.0: danger is text and icon only, never a
// fill), and a disabled row greys both out and shows why on the right (`Already first`).
//
// Not a ListRow variant: ListRow is a list entry (row title at `text/primary`, subtitle, badge,
// trailing chevron/value), while a menu action is a command with its own muted look and no
// trailing accessory beyond the disabled reason.

import { Pressable, StyleSheet, Text } from 'react-native';

import type { IconComponent } from '../icons/IconFrame';
import { COLORS, ICON_SIZES, TYPOGRAPHY } from '../tokens';

// No tokens for these — the 08.7 mockup's `.act` rows size them directly.
const ROW_PADDING_VERTICAL = 13;
const ICON_GAP = 12;
const REASON_FONT_SIZE = 12;
const DIVIDER_WIDTH = 1;

export type ActionRowVariant = 'default' | 'danger';

export type ActionRowProps = {
  icon: IconComponent;
  label: string;
  onPress: () => void;
  variant?: ActionRowVariant;
  /** Set when the action isn't available: the row is disabled and shows this on the right. */
  disabledReason?: string;
};

export function ActionRow({
  icon: Icon,
  label,
  onPress,
  variant = 'default',
  disabledReason,
}: ActionRowProps) {
  const disabled = disabledReason !== undefined;
  const iconColor = disabled
    ? COLORS['text/disabled']
    : variant === 'danger'
      ? COLORS.danger
      : COLORS['text/muted'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.row}
    >
      <Icon size={ICON_SIZES['icon/button']} color={iconColor} />
      <Text
        style={[
          styles.label,
          variant === 'danger' && styles.labelDanger,
          disabled && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>
      {disabledReason !== undefined && <Text style={styles.reason}>{disabledReason}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ICON_GAP,
    paddingVertical: ROW_PADDING_VERTICAL,
    borderTopWidth: DIVIDER_WIDTH,
    borderTopColor: COLORS['border/divider'],
  },
  label: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/secondary'],
  },
  labelDanger: {
    color: COLORS.danger,
  },
  labelDisabled: {
    color: COLORS['text/disabled'],
  },
  reason: {
    fontSize: REASON_FONT_SIZE,
    color: COLORS['text/faint'],
  },
});
