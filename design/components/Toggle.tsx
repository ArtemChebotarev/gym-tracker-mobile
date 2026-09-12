// Toggle — see 08.0 · Design SDK, "Компоненты": on/off, always carrying a label and an
// explanatory caption below it (08.0: "Всегда с подписью и пояснением под ней"). Built on React
// Native's own Switch rather than a custom control: it needs no icon, and Switch is already
// themeable (trackColor/thumbColor) and accessible out of the box.

import { StyleSheet, Switch, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';

export type ToggleProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function Toggle({ label, description, value, onValueChange }: ToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
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
  text: {
    flex: 1,
  },
  label: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  description: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/faint'],
  },
});
