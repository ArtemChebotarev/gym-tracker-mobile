// The timer action at the foot of an interval or mobility card (10.1 FR-14, GT-206; canvas 9.3): a
// quiet line of orange text under a divider, down to the card's bottom edge, so it doesn't argue with
// Finish workout. What it says and does is the card's; this is only how it looks.
//
// JSX/rendering only — styles live in CardTimerActionStyles.ts, per the code-style skill.

import { Pressable, Text, View } from 'react-native';

import type { IconComponent } from '@design/icons/IconFrame';
import { COLORS, ICON_SIZES } from '@design/tokens';

import { styles } from './CardTimerActionStyles';

export type CardTimerActionProps = {
  /** What the block says, and what it is called for a screen reader. */
  label: string;
  icon: IconComponent;
  onPress: () => void;
  /** The times aren't set yet — the block stays, dimmed. */
  disabled?: boolean;
  testID?: string;
};

export function CardTimerAction({
  label,
  icon: Icon,
  onPress,
  disabled = false,
  testID,
}: CardTimerActionProps) {
  return (
    <Pressable
      {...(testID !== undefined ? { testID } : {})}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.icon}>
        <Icon size={ICON_SIZES['icon/small']} color={COLORS['brand/orange']} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
