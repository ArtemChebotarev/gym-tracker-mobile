// Toggle — see 08.0 · Design SDK, "Компоненты": on/off, carrying a label and an explanatory
// caption below it (08.0: "Всегда с подписью и пояснением под ней"). The caption may be left out
// where the label says it all and a neighbouring toggle's caption covers both — Vibration under
// Sound in Settings' Signals (GT-172). Built on React
// Native's own Switch rather than a custom control: it needs no icon, and Switch is already
// themeable (trackColor/thumbColor) and accessible out of the box. `disabled` dims the whole
// row, matching Button/IconButton's 0.5-opacity disabled treatment.

import { StyleSheet, Switch, Text, View } from 'react-native';
import { COLORS, OPACITY, SPACING, TYPOGRAPHY } from '../tokens';

export type ToggleProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function Toggle({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: ToggleProps) {
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description !== undefined && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: COLORS.accent, false: COLORS['surface/card'] }}
        thumbColor={COLORS['text/primary']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING['space/gap'],
  },
  disabled: {
    opacity: OPACITY['opacity/dimmed'],
  },
  text: {
    flex: 1,
  },
  label: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  // The explanation line reads like a ListRow subtitle — the same step under the label.
  description: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/faint'],
  },
});
