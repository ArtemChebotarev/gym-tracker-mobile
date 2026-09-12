// Dropdown — see 08.0 · Design SDK, "Компоненты": closed / open / selected states for choosing
// one value from a long list (08.0: "Для одиночного выбора из длинного списка"). Reuses
// BottomSheet for the open list and ListRow for each option (see BottomSheet.tsx and
// ListRow.tsx) rather than building a second list/overlay primitive — a long list opening in a
// sheet is exactly what BottomSheet is for.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';
import { BottomSheet } from './BottomSheet';
import { ListRow } from './ListRow';

export type DropdownOption = {
  value: string;
  label: string;
};

export type DropdownProps = {
  label: string;
  options: readonly DropdownOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
};

export function Dropdown({ label, options, value, onChange, placeholder, error }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasError = error !== undefined;
  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setIsOpen(true)}
        style={[styles.field, hasError && styles.fieldError]}
      >
        <Text style={selectedLabel !== undefined ? styles.value : styles.placeholder}>
          {selectedLabel ?? placeholder ?? ''}
        </Text>
      </Pressable>
      {hasError && <Text style={styles.error}>{error}</Text>}

      <BottomSheet visible={isOpen} onClose={() => setIsOpen(false)} title={label}>
        {options.map((option) => (
          <ListRow
            key={option.value}
            title={option.label}
            trailing={option.value === value ? { type: 'value', value: 'Selected' } : undefined}
            onPress={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
          />
        ))}
      </BottomSheet>
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
  field: {
    borderWidth: 1,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
    backgroundColor: COLORS['surface/card'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/row'],
  },
  fieldError: {
    borderColor: COLORS['danger/border'],
  },
  value: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/primary'],
  },
  placeholder: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/faint'],
  },
  error: {
    marginTop: SPACING['space/gap-tight'],
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS.danger,
  },
});
