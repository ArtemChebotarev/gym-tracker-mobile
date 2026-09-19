// Dropdown — see 08.0 · Design SDK, "Компоненты": closed / open / selected states for choosing
// one value from a long list (08.0: "Для одиночного выбора из длинного списка"). The option list
// expands inline directly beneath the trigger field, not in a separate BottomSheet — this is
// itself a form field nested inside a sheet (e.g. the New/Edit exercise sheet), and stacking a
// second full-screen overlay on top of the first reads as a popup rather than a dropdown (see
// 03-new-exercise.html: the option list sits inline, pushing the rest of the form down, exactly
// like the trigger's own bordered box). The trigger's label/box/error chrome comes from
// fieldStyles.ts, shared with TextField, so the two form fields stay visually identical.
//
// The option list itself is capped at PANEL_MAX_HEIGHT and scrolls internally past that — with a
// 12-option list (e.g. every muscle group) rendered in full, opening the dropdown would suddenly
// grow the whole enclosing sheet to fit it, shoving the footer buttons down and reflowing
// everything around it. A capped, independently-scrollable panel keeps opening/closing a
// dropdown from visibly resizing its parent sheet.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { circle } from '../shapes';
import { fieldStyles } from './fieldStyles';

export type DropdownOption = {
  value: string;
  label: string;
  /** Leading color dot, e.g. a muscle group's family color (03-new-exercise.html). Omit for a
   * plain option row. */
  dotColor?: string;
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
  const selectedOption = options.find((option) => option.value === value);

  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((open) => !open)}
        style={[fieldStyles.box, hasError && fieldStyles.boxError, styles.trigger]}
      >
        <View style={styles.triggerValue}>
          {selectedOption?.dotColor !== undefined && (
            <View style={[styles.dot, { backgroundColor: selectedOption.dotColor }]} />
          )}
          <Text style={selectedOption !== undefined ? styles.value : styles.placeholder}>
            {selectedOption?.label ?? placeholder ?? ''}
          </Text>
        </View>
        <Text style={styles.chevron}>{isOpen ? '︿' : '﹀'}</Text>
      </Pressable>
      {hasError && <Text style={fieldStyles.error}>{error}</Text>}

      {isOpen && (
        <ScrollView
          style={styles.panel}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                {option.dotColor !== undefined && (
                  <View style={[styles.dot, { backgroundColor: option.dotColor }]} />
                )}
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {selected && <Text style={styles.check}>✓</Text>}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  value: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/primary'],
  },
  placeholder: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/faint'],
  },
  chevron: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/faint'],
  },
  panel: {
    // Roughly 4.5 option rows tall — enough to preview the list without letting it dominate the
    // sheet. The half-row is deliberate: a visibly cut-off row is a stronger "there's more,
    // scroll" affordance than a clean break at a whole row boundary.
    maxHeight: SIZES['size/dropdown-panel'],
    marginTop: SPACING['space/gap-tight'],
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/row'],
  },
  optionSelected: {
    backgroundColor: COLORS['surface/control-active'],
  },
  optionLabel: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
    flex: 1,
  },
  optionLabelSelected: {
    color: COLORS['text/primary'],
  },
  check: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS.accent,
  },
  dot: {
    ...circle(SIZES['size/dot-large']),
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
});
