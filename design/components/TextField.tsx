// TextField — see 08.0 · Design SDK, "Компоненты": empty / filled / error states. The
// placeholder is meant to show an example value rather than repeat the label (08.0:
// "Плейсхолдер — пример значения, не повтор подписи") — a copy rule for callers, not something
// this component enforces.

import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';

export type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
};

export function TextField({ label, value, onChangeText, placeholder, error }: TextFieldProps) {
  const hasError = error !== undefined;

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS['text/faint']}
        style={[styles.input, hasError && styles.inputError]}
      />
      {hasError && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
    marginBottom: SPACING['space/gap-tight'],
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
    backgroundColor: COLORS['surface/card'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/row'],
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/primary'],
  },
  inputError: {
    borderColor: COLORS['danger/border'],
  },
  error: {
    marginTop: SPACING['space/gap-tight'],
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS.danger,
  },
});
