// ActionRow — one action in a menu sheet, after the 08.7 mockup's `⋯` sheets (header menu, 096;
// exercise menu, 097): an 18pt icon on the left, the label, and a divider above each row. The row
// picks the icon's color itself, so the caller passes the icon component rather than a rendered
// icon — `danger` tints both icon and label red (08.0: danger is text and icon only, never a
// fill), and a disabled row greys both out and shows why on the right (`Already first`).
//
// An optional `caption` sits under the label, for a sheet whose rows are choices rather than
// commands and need a line to tell them apart (08.8's `Build the week yourself` under `From
// scratch`, task 123). A row with a caption says why it is off there instead of on the right:
// the explanation belongs where the eye already is, and a sentence squeezed against the right
// edge next to a caption reads as a third column. `disabled` covers exactly that case — the row
// is off, and the caption carries the reason.
//
// Not a ListRow variant: ListRow is a list entry (row title at `text/primary`, subtitle, badge,
// trailing chevron/value), while a menu action is a command with its own muted look and no
// trailing accessory beyond the disabled reason.

import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconComponent } from '../icons/IconFrame';
import { BORDER_WIDTHS, COLORS, ICON_SIZES, SPACING, TYPOGRAPHY } from '../tokens';

export type ActionRowVariant = 'default' | 'danger';

export type ActionRowProps = {
  icon: IconComponent;
  label: string;
  onPress: () => void;
  variant?: ActionRowVariant;
  /** A line under the label, when the row is a choice rather than a command. */
  caption?: string;
  /** Set when the action isn't available: the row is disabled and shows this on the right. */
  disabledReason?: string;
  /** Turns the row off without a right-hand reason — for a row whose `caption` gives it. */
  disabled?: boolean;
};

export function ActionRow({
  icon: Icon,
  label,
  onPress,
  variant = 'default',
  caption,
  disabledReason,
  disabled: disabledProp,
}: ActionRowProps) {
  const disabled = disabledProp === true || disabledReason !== undefined;
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
      <View style={styles.text}>
        <Text
          style={[
            styles.label,
            variant === 'danger' && styles.labelDanger,
            disabled && styles.labelDisabled,
          ]}
        >
          {label}
        </Text>
        {caption !== undefined && (
          <Text style={[styles.caption, disabled && styles.captionDisabled]}>{caption}</Text>
        )}
      </View>
      {disabledReason !== undefined && <Text style={styles.reason}>{disabledReason}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/md'],
    paddingVertical: SPACING['space/action-row-y'],
    borderTopWidth: BORDER_WIDTHS['border/default'],
    borderTopColor: COLORS['border/divider'],
  },
  text: {
    flex: 1,
    gap: SPACING['space/xs'],
  },
  label: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/secondary'],
  },
  caption: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/faint'],
  },
  captionDisabled: {
    color: COLORS['text/disabled'],
  },
  labelDanger: {
    color: COLORS.danger,
  },
  labelDisabled: {
    color: COLORS['text/disabled'],
  },
  reason: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/faint'],
  },
});
