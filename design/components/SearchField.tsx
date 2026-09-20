// SearchField — see 08.0 · Design SDK, "Компоненты": empty / with-text / with-clear states.
// Filters as you type, with no search button (08.0: "без кнопки поиска — фильтрация на лету").
// Like IconButton (see design/components/IconButton.tsx), the project has no icon library yet,
// so the leading icon is supplied by the caller as `icon` rather than owned by this component.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BORDER_WIDTHS, COLORS, ICON_SIZES, OPACITY, RADII, SPACING, TYPOGRAPHY } from '../tokens';
import { square, tapTargetSlop } from '../shapes';

export type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  icon?: ReactNode;
  placeholder?: string;
};

export function SearchField({ value, onChangeText, icon, placeholder }: SearchFieldProps) {
  return (
    <View style={styles.container}>
      {icon}
      <TextInput
        accessibilityLabel="Search"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS['text/faint']}
        style={styles.input}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          hitSlop={tapTargetSlop(ICON_SIZES['icon/button'])}
          style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
        >
          <Text style={styles.clear}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
    paddingHorizontal: SPACING['space/gap'],
    // The same vertical padding as a TextField's box, so the two read as one height.
    paddingVertical: SPACING['space/row'],
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/primary'],
  },
  // An icon-sized box so `tapTargetSlop` knows what it grows to 44pt, without making the field
  // taller the moment text (and with it this button) appears.
  clearButton: {
    ...square(ICON_SIZES['icon/button']),
    alignItems: 'center',
    justifyContent: 'center',
  },
  clear: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    color: COLORS['text/faint'],
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
});
