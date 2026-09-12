// TextField — see 08.0 · Design SDK, "Компоненты": empty / filled / error states. The
// placeholder is meant to show an example value rather than repeat the label (08.0:
// "Плейсхолдер — пример значения, не повтор подписи") — a copy rule for callers, not something
// this component enforces. Shares its label/box/error chrome with Dropdown via fieldStyles.ts.

import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../tokens';
import { fieldStyles } from './fieldStyles';

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
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS['text/faint']}
        style={[fieldStyles.box, hasError && fieldStyles.boxError, styles.text]}
      />
      {hasError && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/primary'],
  },
});
